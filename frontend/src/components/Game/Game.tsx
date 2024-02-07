import React, { useEffect, useRef} from 'react';
import { Socket } from 'socket.io-client';
import './Game.css';

interface Paddle  {
    top: number;
    bottom: number;
    left: number;
    right: number;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    score: number;
};

interface Ball  {
    top: number;
    bottom: number;
    left: number;
    right: number;
    x: number;
    y: number;
    radius: number;
    velocityX: number;
    velocityY: number;
    speed: number;
    color: string;
};

interface InfoGame {
    roomID : string;
    NumPalyer: number;
    playerName1: string;
    playerName2: string;
    socket: Socket;
}

function drawRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawNet(ctx: CanvasRenderingContext2D, net: { x: number, y: number, width: number, height: number, color: string }, canvasHeight: number): void {
    for (let i = 0; i <= canvasHeight; i += 15) {
        drawRect(ctx, net.x, net.y + i, net.width, net.height, net.color);
    }
}

function drawArc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
    ctx.fillStyle = "#FFF";
    ctx.font = "20px fantasy";
    ctx.fillText(text, x, y);
}

const CanvasGame: React.FC<{ infoGame: InfoGame }>= ({ infoGame }) => {
    console.log(infoGame);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const roomIdRef = useRef(infoGame.roomID);
    const socket = infoGame.socket;
    const numPlayer = infoGame.NumPalyer;
    
    // Initialisation du jeu
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx ) 
        return;
    
    let animationFrameId: number;
    // console.log(numPlayer);
    // Initialisation de la raquette de l'utilisateur
    // mettre les width et height en fonction de canvas.height et canvas.width pour le cote responsive
    let player1: Paddle = {
        x: 0,
        y: (canvas.height - 100) / 2,
        width: 10,
        height: 100,
        score: 0,
        color: "WHITE",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
    };
    
    let player2: Paddle = {
        x: canvas.width - 10,
        y: (canvas.height - 100) / 2,
        width: 10,
        height: 100,
        score: 0,
        color: "WHITE",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
    };

    
    let ball: Ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 10,
        velocityX: 5,
        velocityY: 5,
        speed: 7,
        color: "WHITE",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
    };
        
        // Initialisation du filet
        const net = {
            x: (canvas.width - 2) / 2,
            y: 0,
            width: 2,
            height: 10,
            color: "WHITE"
        };

        socket.on('game-state', (gameState) => {
            if (numPlayer === 1)
                player2.y = gameState.padU2.y;
            else
                player1.y = gameState.padU2.y;
            ball.x = gameState.ball.x;
            ball.y = gameState.ball.y;
            player1.score = gameState.score.scoreU1;
            player2.score = gameState.score.scoreU2;      
        });



        const gameLoop = () => {
            drawRect(ctx, 0, 0, canvas.width, canvas.height, "#000");
            drawRect(ctx, player1.x, player1.y, player1.width, player1.height, player1.color);
            drawRect(ctx, player2.x, player2.y, player2.width, player2.height, player2.color);
            drawArc(ctx, ball.x, ball.y, ball.radius, ball.color);
            drawNet(ctx, net, canvas.height);
            drawText(ctx, `Player 1: ${player1.score}`, 10, 30);
            drawText(ctx, `Player 2: ${player2.score}`, canvas.width - 150, 30);
            animationFrameId = requestAnimationFrame(gameLoop);
        };

        gameLoop();
    
        // Gestionnaire d'événements
        const mouseMoveHandler = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const mouseY = event.clientY - rect.top;
            if (numPlayer === 1) {
                player1.y = Math.min(mouseY - player1.height / 2, canvas.height - player1.height);
                if (player1.y < 0) {
                    player1.y = 0;
                }
                socket.emit('user-paddle-move', { y: player1.y , roomId: roomIdRef.current, x: player1.x});
            }
            else {
                player2.y = Math.min(mouseY - player2.height / 2, canvas.height - player2.height);
                if (player2.y < 0) {
                    player2.y = 0;
                }
                socket.emit('user-paddle-move', { y: player2.y , roomId: roomIdRef.current, x: player2.x});
            }
        };

        canvas.addEventListener('mousemove', mouseMoveHandler);

        return () => {
            canvas.removeEventListener('mousemove', mouseMoveHandler);
            cancelAnimationFrame(animationFrameId);
            socket.emit('client-disconnect');
            socket.off('game-state');
        };
    }, [socket, numPlayer]);

    return (
        <div>
            <canvas ref={canvasRef} width="800" height="400" className='canvas'/>
        </div>
    );
};

export default CanvasGame;
