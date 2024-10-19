import { Text, View, StyleSheet } from "react-native";
import { useContext } from 'react';

import { NavigationProvider, NavigationContext } from './providers/NavigationContext';

import InterfaceIndex from './interfaces';

import ErrorBox from './components/ErrorBox';

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
  else {
    return (
      <ErrorBox 
        head={"Internal Error"}
        body={`Unknown navigation page ${navPage}`}
      />
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    width: '100%'
  }
});