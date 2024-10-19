import { createContext, useState, useEffect } from 'react';

export const NavigationContext = createContext();

export const NavigationProvider = ({children}) => {
	const [navPage, setNavPage] = useState('index');
	const [navArgs, setNavArgs] = useState({});

	useEffect(() => {
		setNavArgs({});
	}, [navPage]);

	return (
		<NavigationContext.Provider value={{ navPage, setNavPage, navArgs, setNavArgs }}>
			{children}
		</NavigationContext.Provider>
	);
};