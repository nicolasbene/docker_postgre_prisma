import React, { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

// import kick_icon from '../assets/chat/ban.svg';
import game_icon from "../assets/chat/boxing-glove.svg";
import profilePic from "../assets/avatar.png";
import addFriendIcon from "../assets/chat/Group_add_light.png";
import chatIcon from "../assets/chat/Chat.svg";
import crown from "../assets/chat/crown.svg";
import blockIcon from "../assets/chat/block.svg";
import kickIcon from "../assets/chat/kick.svg";
import leaveIcon from "../assets/chat/leave.svg";

// import promote_icon from '../assets/chat/crown.svg';

import { UserType } from "@/common/userType.interface";
import { channel } from "diagnostics_channel";
import axios from "axios";
// import { UserType } from "./Conversation";

interface ChatInfosProps {
  setShowModal: (show: boolean) => void;
  socket: Socket;
  channelName: string;
  currentUserLogin: string;
}

interface UserListResponse {
  channel: string;
  users: UserType[];
}

const ChatInfos = ({
  setShowModal,
  socket,
  channelName,
  currentUserLogin,
}: ChatInfosProps) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [friendsIds, setFriendIds] = useState<number[]>([]);
  // const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    // Initial user list
    socket.emit(
      "userList",
      { channel: channelName },
      (res: UserListResponse) => {
        setUsers(res.users.filter((user) => user.username));
        // const user =
        // res.users.find((user) => user.login === currentUserLogin) || null;
        // if (user && (user.role === 'ADMIN' || user.role === 'OWNER')) setIsAdmin(true);
      }
    );

    // Listen for updates to the user list
    // check event userListUpdate in JoinChannel.tsx
    socket.on("userListUpdate", (res: UserListResponse) => {
      // console.log("===== SOCKET EVENT RECIEVED =====");
      setUsers(res.users.filter((user) => user.username));
    });

    return () => {
      socket.off("userListUpdate");
    };
    // eslint-disable-next-line
  }, [socket, channelName, currentUserLogin]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8080/users/friends",
          {
            withCredentials: true,
          }
        );
        setFriendIds(response.data.map((friend) => friend.id));
      } catch (error) {
        console.error("Failed to fetch friends:", error);
      }
    };

    fetchFriends();
  }, []);

  const addFriend = async (friendId: number) => {
    try {
      const response = await axios.post(
        "http://localhost:8080/users/add-friend",
        {
          userId: currentUserLogin,
          friendId,
        },
        {
          withCredentials: true,
        }
      );
      console.log("response:", response.data);
      setFriendIds((prevFriendIds) => [...prevFriendIds, friendId]);
    } catch (error) {
      console.error("Failed to add friend:", error);
    }
  };

  //   const promoteUser = (user: UserType) => {
  //     socket.emit('promote', { channel: channelName, user: user.login });
  //     setUsers(
  //       users.map((u) => {
  //         if (u.id === user.id) {
  //           return { ...u, role: 'ADMIN' };
  //         }
  //         return u;
  //       }),
  //     );
  //   };

  //   const kickUser = (user: UserType) => {
  //     socket.emit('kick', { channel: channelName, user: user.login });
  //     setUsers(users.filter((u) => u.id !== user.id));
  //   };

  // Contains the list of members in the channel, whith a possibility to kick them, to promote them as admin, and to start a game with them
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-white-1 p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl">Members</h2>
        <button
          onClick={() => setShowModal(false)}
          className="rounded-lg border-2 border-white-3 p-1 text-xl hover:bg-red hover:text-white-1"
        >
          Close
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {users.map((user) => {
          return (
            <div
              key={user.id}
              className="flex items-center justify-between gap-4"
            >
              {/* need to realign the profile pic with the non-owner ones */}
              {user.role === "OWNER" && (
                <button
                  disabled
                  className="rounded-full p-1 hover:bg-green-1"
                  title="Channel owner"
                >
                  <img className="w-6" src={crown} alt="start game icon" />
                </button>
              )}
              <div className="flex items-center gap-2">
                <img
                  className="w-8 rounded-full"
                  src={user.profilePic || profilePic}
                  alt="user"
                />
                <h3 className="text-lg">
                  {user.username}
                  {user.username === currentUserLogin ? " (you)" : ""}
                </h3>
              </div>
              {/* render the action buttons for other users only */}
              {user.username !== currentUserLogin && (
                <div className="flex gap-2">
                  <button
                    className="rounded-full p-1 hover:bg-green-1"
                    title="Start a game"
                  >
                    <img
                      className="w-6"
                      src={game_icon}
                      alt="start game icon"
                    />
                  </button>
                  <button
                    className="rounded-full p-1 hover:bg-green-1"
                    title="Send DM"
                  >
                    <img className="w-6" src={chatIcon} alt="chat icon" />
                  </button>
                  <button
                    className="rounded-full p-1 hover:bg-green-1"
                    title="Add friend"
                    onClick={() => addFriend(user.id)}
                  >
                    {/* show panel "friend added" ?*/}
                    <img
                      className="w-6"
                      src={addFriendIcon}
                      alt="add friend icon"
                    />
                  </button>
                  <button
                    className="rounded-full p-1 hover:bg-green-1"
                    title="Block user"
                  >
                    <img
                      className="w-6"
                      src={blockIcon}
                      alt="Block user icon"
                    />
                  </button>
                  {/* render the promote user button for admins only */}
                  {user.role == "ADMIN" ||
                    ("OWNER" && (
                      <button
                        className="rounded-full p-1 hover:bg-green-1"
                        title="Kick user"
                      >
                        <img
                          className="w-6"
                          src={kickIcon}
                          alt="kick user icon"
                        />
                      </button>
                    ))}
                </div>
              )}
              {user.username === currentUserLogin && (
                <div className="flex gap-2">
                  <button
                    className="rounded-full p-1 hover:bg-green-1"
                    title="Leave channel"
                  >
                    <img className="w-6" src={leaveIcon} alt="Leave icon" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatInfos;
