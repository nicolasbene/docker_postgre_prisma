import React, { useState, useEffect } from 'react';
import UserInformation from '../components/User/UserInformation.tsx';
import UserGameStats from '../components/User/UserGameStats.tsx';
import FriendsList from '../components/User/UserFriendsList.tsx';
import Particles from '../components/Home/Particles.tsx';
import NotConnected from '../components/NotSignedIn.tsx';
import axios from 'axios';
import { useUserContext } from '../context/UserContext';
import UpdateModal from '../components/UpdateModal.tsx'
import TwoFactorMod from '../components/LoginSignup/TwoFactorMod.tsx';
import { ModalInputs } from '../components/LoginSignup/TwoFactorMod.tsx';

const User = () => {
	const {user, updateUser, fetchUserData } = useUserContext();
	const [avatarFile, setAvatarFile] = useState(null);
	const [showUpdateModal, setShowUpdateModal] = useState(false);
	const [updateModalMessage, setUpdateModalMessage] = useState('');
	const [isUpdateSuccessful, setIsUpdateSuccessful] = useState(false);

	const [is2FAEnabled, setIs2FAEnabled] = useState(user ? user.twoFactorEnabled : false);
	const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | undefined>();
	const [twoFactorSecret, setTwoFactorSecret] = useState<string | undefined>();
	const [error, setError] = useState<string | undefined>();
	const [display2FAModal, setDisplay2FAModal] = useState(false);
	const [display2FADisableModal, setDisplay2FADisableModal] = useState(false);


	useEffect(() => {
		fetchUserData();
	  }, [fetchUserData]);

	useEffect(() => {
		console.log(showUpdateModal ? "modal is ON" : "modal is OFF");
	  }, [showUpdateModal]);

	const onAvatarFileSelect = (file) => {
		setAvatarFile(file);
	};

	const triggerModal = (success) => {
		setIsUpdateSuccessful(success);
		setShowUpdateModal(true);
		setTimeout(() => {
		  setShowUpdateModal(false);
		}, 2000); // Hide modal after 2 seconds
	  };

	const handleUpdateProfile = async () => {

		// Send new data if updated
		const userData = {
			username: user.username,
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
		  };
		  console.log("frontend: data being passed to back:", userData);
		  try {
			const response = await axios.patch('http://localhost:8080/users', userData, {
			  withCredentials: true,
			});
				console.log('frontend: user information successfully updated!', response.data);
				setUpdateModalMessage('User information successfully updated!');
				triggerModal(true); // Trigger modal with success status
			} catch (error) {
				console.error('frontend: error updating user information:', error);
				setUpdateModalMessage('Error updating user information.');
				triggerModal(false); // Trigger modal with failure status
			}
		
		// Check if there's a new avatar to upload
		if (avatarFile) {
			const formData = new FormData();
			formData.append('file', avatarFile);
			console.log("frontend: image being sent :", formData);

			try {
				const response = await axios.post('http://localhost:8080/users/upload-profile-picture', formData, {
					withCredentials: true,
				});
				console.log('frontend: new profile pic successfully uploaded!', response.data);
				setUpdateModalMessage('new profile pic successfully uploaded!');
				triggerModal(true); // Trigger modal with success status
			} catch (error) {
				console.error('frontend: error uploading a new profile pic:', error);
				setUpdateModalMessage('error uploading a new profile pic!');
				triggerModal(true); // Trigger modal with success status
			}
		} else {
			console.log('frontend: no new avatar to upload, no request made to back.');
		}
	};
	
	///2FA
	const handle2FAToggle = () => {
		const new2FAStatus = !user.twoFactorEnabled;
		setIs2FAEnabled(new2FAStatus);
	};

	useEffect(() => {
		console.log(is2FAEnabled ? "2FA ON" : "2FA OFF");
	  }, [is2FAEnabled]);

	useEffect(() => {
		try {
			const manage2FAInit = async () => {
				console.log(is2FAEnabled ? "2FA ON - init" : "2FA OFF - init");
				// console.log(user.twoFactorEnabled ? "User 2FA TRUE" : "User 2FA FALSE");
				if (user && is2FAEnabled === true && user.twoFactorEnabled === false) {
				const response = await axios.get('http://localhost:8080/users/2FAInit', {
				withCredentials: true },);
				setQrCodeDataUrl(response.data.qrCode);
				setTwoFactorSecret(response.data.secret);
				setDisplay2FAModal(true);
				updateUser({ twoFactorEnabled: true });
				}
			else if (user && is2FAEnabled === false && user.twoFactorEnabled === true) {
				setDisplay2FADisableModal(true);
				updateUser({ twoFactorEnabled: false });
				}
			};
			manage2FAInit();
		} catch (error: any) {
			console.error('frontend: error initializing 2FA:', error);
		}
	}, [is2FAEnabled]);

	const enableTwoFactor = async (data: ModalInputs) => {
		try {
			console.log('frontend: data2FA being pass to back:', data);
			await axios.post('http://localhost:8080/users/2FAEnable', 
				{code: data.validationCode }, 
				{withCredentials: true});
			setDisplay2FAModal(false);
			setError(undefined);
			updateUser({ twoFactorEnabled: true });
		} catch (error: any) {
			console.error('frontend: error enabling 2FA:', error);
			console.log('frontend: error enabling 2FA:', error.response.data.message);
			setError(error.response.data.message);
		}
	};

	const disableTwoFactor = async (data: ModalInputs) => {
		try {
			await axios.post('http://localhost:8080/users/2FADisable', 
				{code: data.validationCode }, 
				{withCredentials: true});
			setDisplay2FADisableModal(false);
			setError(undefined);
			updateUser({ twoFactorEnabled: false });
		} catch (error: any) {
			console.error('frontend: error disabling 2FA:', error);
			setError(error.response.data.message);
		}
	};


	//@@@TODO: Fetch data from backend 
	const friends = [
		{ nickname: 'Friend1', online: true },
		{ nickname: 'Friend2', online: false },
		{ nickname: 'Friend3', online: false },
		{ nickname: 'Friend4', online: false },
		{ nickname: 'Friend5', online: true },
		{ nickname: 'Friend6', online: false },
		{ nickname: 'Friend7', online: true },
		{ nickname: 'Friend8', online: false },
	];

	const gameStats = {
		totalGamesPlayed: 30,
		totalWins: 20,
		totalLosses: 10,
		Rank: 1,
	  };


	  return user ? (
		<div className="flex items-center justify-center min-h-screen relative pb-8">
			<Particles className="absolute inset-0 -z-10" quantity={1000} />
			  {/* Conditional rendering of the update status modal */}
			<UpdateModal showUpdateModal={showUpdateModal} updateModalMessage={updateModalMessage} isUpdateSuccessful={isUpdateSuccessful}/>
			<div className="flex justify-start"> 
	  
			{/* Left Section: User Information and Friends */}
			<div className="flex flex-col mr-8"> {/* Margin right to separate from Game Stats */}
				{/* User Information Box */}
				<UserInformation 
					handle2FAToggle={handle2FAToggle}
					handleUpdateProfile={handleUpdateProfile}
					onAvatarFileSelect={onAvatarFileSelect}
					/>
	  
				{/* Friends Box */}
				<FriendsList friends={friends}/>
			</div>
	  
			{/* Right Section: Game Stats */}
				{/* Game Stats Box */}
				<UserGameStats 
					gameStats={gameStats}/>

		</div>
		{display2FAModal ? (
                <TwoFactorMod
                    title="TWO-FACTOR AUTHENTICATION"
                    qrCodeDataUrl={qrCodeDataUrl}
                    secret={twoFactorSecret}
                    modalId={'Enable-2fa-modal'}
                    closeModal={() => setDisplay2FAModal(false)}
                    onSubmit={enableTwoFactor}
                    error={error}
                />
            ) : null}
        {display2FADisableModal ? (
                <TwoFactorMod
                    title="TWO-FACTOR AUTHENTICATION"
                    modalId={'Disable-2fa-modal'}
                    closeModal={() => setDisplay2FADisableModal(false)}
                    onSubmit={disableTwoFactor}
                    error={error}
                />
            ) : null}
	</div>
	)
	: (
		<NotConnected message="You need to log in to access your settings" />
	);
}

export default User;