import React, {useEffect, useState} from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";

interface WalletBalance {
    total: number;
    currency: string;
}

const PaymentScreen: React.FC = () => {
    const [balance, setBalance] = useState<WalletBalance>({
        total: 20,
        currency: 'INR'
    });
    const [loading, setLoading] = useState<boolean>(false);

    const handleAddMoney = () => {
        Alert.prompt(
            'Add Money',
            'Enter the amount you want to add to your wallet:',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Proceed',
                    onPress: (amount) => {
                        const numAmount = parseFloat(amount || '0');
                        if (numAmount > 0) {
                            simulatePaymentFlow(numAmount);
                        } else {
                            Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
                        }
                    },
                },
            ],
            'plain-text',
            '',
            'numeric'
        );
    };

    const simulatePaymentFlow = async (amount: number) => {
        setLoading(true);

        try {
          
            await new Promise(resolve => setTimeout(resolve, 1500));

            const newBalance = balance.total + amount;
            setBalance({
                ...balance,
                total: newBalance
            });

          
            await AsyncStorage.setItem('walletBalance', JSON.stringify({
                total: newBalance,
                currency: 'INR'
            }));

            Alert.alert(
                'Payment Successful',
                `₹${amount} has been added to your wallet!`
            );
        } catch (error) {
            console.error('Payment error:', error);
            Alert.alert('Payment Failed', 'There was an error processing your payment. Please try again later.');
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        const loadBalance = async () => {
            const storedBalance = await AsyncStorage.getItem('walletBalance');
            if (storedBalance) {
                setBalance(JSON.parse(storedBalance));
            }
        };
        loadBalance();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.walletCard}>
                <Text style={styles.balanceLabel}>Wallet Balance</Text>
                <Text style={styles.balanceAmount}>
                    ₹{balance.total}
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.addButton, loading && styles.disabledButton]}
                onPress={handleAddMoney}
                disabled={loading}
            >
                <Text style={styles.addButtonText}>
                    {loading ? 'Processing...' : 'Add Money'}
                </Text>
            </TouchableOpacity>

            <View style={styles.infoContainer}>

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    walletCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 16,
        color: '#666',
        marginBottom: 5,
    },
    balanceAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
    },
    addButton: {
        backgroundColor: '#53a20e',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    disabledButton: {
        backgroundColor: '#a0a0a0',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    infoContainer: {
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    infoText: {
        color: '#495057',
        marginBottom: 8,
        fontWeight: 'bold',
    },
    infoPoint: {
        color: '#6c757d',
        marginLeft: 10,
        marginBottom: 5,
    },
});

export default PaymentScreen;