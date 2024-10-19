import { Text, View, Alert } from "react-native";
import { useEffect, useState } from 'react';

import axios from 'axios';

const InterfaceIndex = () => {
	const [err, setError] = useState('');

	useEffect(() => {
		console.log("using effect");
		fetchData = async () => {
			try {
				const resp = await axios.get("http://localhost:9901/interfaces");
				const data = resp.data;
			} catch (err) {
				setError(err);
			}
		};

		fetchData();
	}, []);

	return (
		<>
			<Text>InterfaceIndex</Text>
			<Text>err = {JSON.stringify(err, null, 2)}</Text>
		</>
	);
};

export default InterfaceIndex;