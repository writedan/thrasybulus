import { Text, View } from "react-native";
import { useContext } from 'react';

import { NavigationProvider, NavigationContext } from './providers/NavigationContext';

import InterfaceIndex from './interfaces';

export default function App() {
  return (
    <NavigationProvider>
      <Navigation />
    </NavigationProvider>
  );
};

const Navigation = () => {
  const {navPage, setNavPage} = useContext(NavigationContext);
  
  if (navPage == "index") {
    return (<InterfaceIndex />);
  }
};