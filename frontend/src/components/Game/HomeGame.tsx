import React, { useEffect, useRef, useState } from 'react';
import CanvasGame from './Game';
import io, { Socket } from 'socket.io-client';
import './Game.css';
import { useUserContext } from '../../context/UserContext';


interface InfoGame {
    roomID: string;
    NumPalyer: number;
    playerName1: string;
    playerName2: string;
    socket: Socket;
}

interface userDto {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    imagePath: string;
    JWTtoken?: string;
    displayName: string;
    description: string;
    bannerPath: string;
    intraImageURL: string;
    status: string;
  }

const PongGame: React.FC = () => {
    // const {user} = useUserContext();
    const socketRef = useRef(io('http://localhost:8080/game'));
    // const socketRef = useRef(io('http://localhost:8080/game', { withCredentials: true }));
    const identifiandPlayer = useRef(0);
    const [infoGame, setInfoGame] = useState<InfoGame | null>(null);
    const [playerLeftGame, setPlayerLeftGame] = useState(false);
    const [gameFinished, setGameFinished] = useState(false);
    const [winningStatus, setWinningStatus] = useState("Undefined");
    const [scorePlayer1, setScorePlayer1] = useState(0);
    const [scorePlayer2, setScorePlayer2] = useState(0);
    const {user, fetchUserData} = useUserContext();
    const [joinedGame, setJoinedGame] = useState(false);

    
    useEffect(()=> {
        fetchUserData();
    }, [fetchUserData]);
    
    let clienInfoCookie: userDto | undefined;
    clienInfoCookie = user;
    
    const handleJoinNormalGame = () => {
        setJoinedGame(true);
        if (clienInfoCookie?.username !== undefined && clienInfoCookie?.id !== undefined ) {
            socketRef?.current.emit('join', { username: clienInfoCookie?.username, userId: clienInfoCookie?.id});
        }
    };

    const handleJoinFreestyleGame = () => {
        setJoinedGame(true);
        if (clienInfoCookie?.username !== undefined && clienInfoCookie?.id !== undefined ) {
            socketRef?.current.emit('join-freestyle', { username: clienInfoCookie?.username, userId: clienInfoCookie?.id});
        }
    };
    
    // console.log(user.username);
    useEffect(() => {
        const socket = socketRef?.current;
        if (!socket || !joinedGame)
            return;

        // console.log("username:", clienInfoCookie?.username);
        // console.log("userId:", clienInfoCookie?.id);

        //quand le client recois room-id c'est que le server a trouve un adversaire et que la partie commence
        socket.on('room-id', (id) => {
            identifiandPlayer.current = id.NumPlayer;
            setInfoGame({
                roomID: id.roomID,
                NumPalyer: id.NumPlayer,
                playerName1: id.playerName1,
                playerName2: id.playerName2,
                socket: socket,
            });
        });


        socket.on('player-left-game', () => {
            setPlayerLeftGame(true);
        });

        socket.on('game-finish', (data) => {
            setGameFinished(true);
            setScorePlayer1(data.score.scoreU1);
            setScorePlayer2(data.score.scoreU2);
            if (identifiandPlayer.current === 1)
            {
                if (data.score.scoreU1 > data.score.scoreU2)
                    setWinningStatus("Win");
                else
                    setWinningStatus("Lose");
            }
            else if (identifiandPlayer.current === 2) {
                if (data.score.scoreU2 > data.score.scoreU1)
                    setWinningStatus("Win");
                else
                    setWinningStatus("Lose");
            }
            socket.emit('finish');
        });
        return () => {
            console.log("je suis pas sense etre allll")
            socket.emit('client-disconnect');
            socket.off('room-id');
            socket.off('player-left-game');
            socket.off('finish');

        };
        // eslint-disable-next-line
    }, [joinedGame]);


    return (
        <div className='game-container'>
            {!joinedGame ? (
                <div className="button-container">
                    <button className="button" onClick={handleJoinNormalGame}>Join normal Game</button>
                    <button className="button" onClick={handleJoinFreestyleGame}>Join freestyle Game</button>
                </div>
            ) : (    
                infoGame ? (
                    gameFinished ? (
                        <div className='info-game'>
                            <p>Finish</p>
                            <p>{winningStatus}</p>
                            <p>{infoGame.playerName1} {scorePlayer1}      {infoGame.playerName2} {scorePlayer2}</p>
                        </div>
                    ) : (
                        playerLeftGame ? (
                            <div className='info-game'>
                                <p>The other player has left the game.</p>
                            </div>
                        ) : (
                            <div className='game-content'>
                                <p className="game-info">the match is played in 11 points </p>
                                <div className='canvas-container'>
                                    <CanvasGame infoGame={infoGame} />
                                </div>
                            </div>
                        )
                    )
                ) : (
                    <div className='info-game'>
                        <p>Waiting for another player...</p>
                    </div>
                )
            )}
        </div>
    );
};    

export default PongGame;
