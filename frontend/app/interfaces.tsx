import { Text, View, Alert, StyleSheet, ScrollView, Pressable } from "react-native";
import { useEffect, useState, useContext } from 'react';

import ErrorBox from './components/ErrorBox';
import Button from './components/Button';

import { NavigationContext } from './providers/NavigationContext';

import axios from 'axios';

const InterfaceIndex = () => {
	const [err, setError] = useState({});
	const [interfaces, setInterfaces] = useState([]);
	const [ifaceViews, setIfaceViews] = useState([]);

    const {setNavPage, setNavArgs} = useContext(NavigationContext);

	useEffect(() => {
		fetchData = async () => {
			try {
				const resp = await axios.get("http://localhost:9901/interfaces");
				const data = resp.data;
				setInterfaces(data);
			} catch (error) {
				console.error(error);
				const err = {head: 'Network Error'};
				
				if (error.code == 'ERR_NETWORK') {
					err.body = "Failed to reach server.";
				} else if (error.code == 'ERR_BAD_REQUEST') {
					err.body = `Bad request: ${error.message}`;
				}
				else {
					err.body = "An unknown error occured.";
				}

				setError(err);
			}
		};

		fetchData();
	}, []);

	useEffect(() => {
		const views = [];
		for (let iface of interfaces) {
			views.push((
				<View style={styles.iface} key={iface.name}>
		            <View style={styles.nameMacContainer}>
		                <Text style={styles.ifaceName}>{iface.name}</Text>
		                <Text style={styles.ifaceMac}>{iface.mac}</Text>
		            </View>
		            <View style={styles.descriptionContainer}>
		            	<View style={styles.statusContainer}>
		                    <View style={[styles.circle, iface.active ? styles.activeCircle : styles.inactiveCircle]} />
		                    <Text style={[styles.status, iface.active ? styles.active : styles.inactive]}>
		                        {iface.active ? 'Active' : 'Inactive'}
		                    </Text>
		                </View>
		                <Text style={styles.ifaceDescription}>{iface.description || "[No description available]"}</Text>
		            </View>
		            <View style={styles.divider} />
		            <View style={styles.ipsContainer}>
		                <ScrollView style={styles.scrollView}>
		                    {iface.ips.length > 0 ? iface.ips.map((ip, index) => (
		                        <Text key={index} style={styles.ifaceIp}>
		                            {ip}
		                        </Text>
		                    )) : (
                                <Text>This interface has no IP addresses.</Text>
                            )}
		                </ScrollView>
		                <Button text="Use Sniffer" onClick={() => {
		                	setNavPage('interface');
                            setNavArgs({'interface': iface});
		                }}/>
		            </View>
		        </View>
			));
		}

		setIfaceViews(views);
	}, [interfaces]);

	return (
		<ScrollView>
			{ifaceViews}
			{err.head && (<ErrorBox head={err.head} body={err.body} />)}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
    iface: {
        padding: 16,
        margin: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    nameMacContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    ifaceName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    ifaceMac: {
        fontSize: 14,
        color: 'black',
    },
    descriptionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    ifaceDescription: {
        fontSize: 12,
        color: 'grey',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    circle: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 4, // Space between circle and text
    },
    activeCircle: {
        backgroundColor: 'green',
    },
    inactiveCircle: {
        backgroundColor: 'red',
    },
    status: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    active: {
        color: 'green',
    },
    inactive: {
        color: 'red',
    },
    divider: {
        height: 1,
        backgroundColor: 'lightgrey',
        marginVertical: 8,
    },
    ipsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    scrollView: {
        maxHeight: 100,
        paddingVertical: 8,
        flex: 1,
    },
    ifaceIp: {
        fontSize: 14,
        color: 'black',
    },
    snifferButton: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#007bff',
        borderRadius: 5,
        marginLeft: 10,
    },
    snifferButtonText: {
        color: 'white',
        fontSize: 14,
    },
});



export default InterfaceIndex;