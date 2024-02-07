import React from 'react';
import { Route, Routes } from 'react-router-dom';
import LoginSignup from './components/LoginSignup/LoginSignup';
import Signwith42 from './components/LoginSignup/Signwith42';
import Home from './components/Home/Home';
import PongGame from './components/Game/HomeGame';
import User from './pages/UserPage';
import { UserProvider } from './context/UserContext';
import Chat from './pages/ChatPage';


function App() {
  return (
	<UserProvider>
		<Routes>
			<Route path="/" element={<LoginSignup />} />
			<Route path="/signwith42" element={<Signwith42 />} />
			<Route path="/home" element={<Home />} />
      		<Route path="/play" element={<PongGame />} />
			<Route path="/user" element={<User />} />
			<Route path="/chat" element={<Chat />} />
		</Routes>
	</UserProvider>
  );
}

export default App;
