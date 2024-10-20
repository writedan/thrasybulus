import { Text, View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useEffect, useState, useContext } from 'react';

import ErrorBox from './components/ErrorBox';
import Button from './components/Button';
import WAlert from './components/Alert';

import { NavigationContext } from './providers/NavigationContext';

import axios from 'axios';

const InterfaceIndex = () => {
	const [err, setError] = useState({});
	const [interfaces, setInterfaces] = useState([]);
	const [ifaceViews, setIfaceViews] = useState([]);
    const [statuses, setStatuses] = useState({});
    const [checkedStatus, setCheckedStatus] = useState(false);

    const {setNavPage, setNavArgs} = useContext(NavigationContext);

    const handleAxiosError = (error) => {
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

            if (error.response) {
                if (error.response.data) {
                    err.body += `: ${error.response.data}`;
                }
            }

            WAlert(err.head, err.body);
    };

    const fetchData = async () => {
        try {
            const resp = await axios.get("http://localhost:9901/interfaces");
            const data = resp.data;
            setInterfaces(data);
        } catch (error) {
            handleAxiosError(error);
        }
    };

    const reloadInterfaces = async () => {
        const statuses = {};
        for (let iface of interfaces) {
            try {
                const resp = await axios.post("http://localhost:9901/interface/IsLive", {
                    "interface": iface.name
                });

                if (resp.data == "active" || resp.data == "inactive") {
                    statuses[iface.name] = resp.data;
                } else {
                    WAlert("API Error", `Interface status check for "${iface.name}" returned unknown value "${resp.data}"`);
                }
            } catch (err) {
                handleAxiosError(err);
            }
        }

        setStatuses(statuses);
    };

	useEffect(() => {
		fetchData();
	}, []);

    useEffect(() => {
        reloadInterfaces();
    }, [interfaces]);

	useEffect(() => {
		const views = [];
		for (let iface of interfaces) {
            const status = statuses[iface.name];
			views.push((
				<View style={styles.iface} key={iface.name}>
		            <View style={styles.nameMacContainer}>
		                <Text style={styles.ifaceName}>{iface.name}</Text>
		                <Text style={styles.ifaceMac}>{iface.mac}</Text>
		            </View>
		            <View style={styles.descriptionContainer}>
		            	<View style={styles.statusContainer}>
		                    <View style={[styles.circle, styles[`${status}Circle`] ]} />
		                    <Text style={[styles.status, styles[status]]}>
		                        {status == undefined ? "Status unavailable" : status}
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
		                <Button 
                            text="Manage"
                            onClick={() => {
    		                	setNavPage('interface');
                                setNavArgs({'interface': iface});
		                    }}
                        />
		            </View>
		        </View>
			));
		}

		setIfaceViews(views);
	}, [interfaces, statuses]);

	return (
        <>
            <View style={styles.container}>
                <View>
                    <Text style={styles.appName}>Thrasybulus</Text>
                    <Button
                        text="Refresh"
                        onClick={() => {
                            fetchData();
                            reloadInterfaces();
                        }}
                    />
                </View>

        		<ScrollView>
        			{ifaceViews}
        		</ScrollView>
            </View>
        </>
	);
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        flexDirection: 'row'
    },
    appName: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
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
        marginRight: 4,
        backgroundColor: 'grey'
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
        color: 'grey'
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
});



export default InterfaceIndex;