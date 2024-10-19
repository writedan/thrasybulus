import { createContext, useState } from 'react';

export const NavigationContext = createContext();

export const NavigationProvider = ({children}) => {
	const [navPage, setNavPage] = useState('index');

	return (
		<NavigationContext.Provider value={{ navPage, setNavPage }}>
			{children}
		</NavigationContext.Provider>
	);
};