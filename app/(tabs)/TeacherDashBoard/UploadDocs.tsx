import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface UploadDocsProps {
    setAadhaarFile: (uri: string) => void;
    setPancardFile: (uri: string) => void;
    setQualificationFile: (uri: string) => void;
    aadhaarFile: string | null;
    pancardFile: string | null;
    qualificationFile: string | null;
}

const UploadDocs: React.FC<UploadDocsProps> = ({
                                                   setAadhaarFile,
                                                   setPancardFile,
                                                   setQualificationFile,
                                                   aadhaarFile,
                                                   pancardFile,
                                                   qualificationFile,
                                               }) => {
    const handleDocumentUpload = async (setFile: (uri: string) => void) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
                multiple: true, // Allow multiple file selection
            });

            if (result.assets && result.assets.length > 0) {
                // Handle multiple files if needed, for now just taking the first one
                const fileUri = result.assets[0].uri;
                setFile(fileUri);
                
                // Show success message
                Alert.alert('Success', 'Aadhaar uploaded successfully!');
            } else if (result.canceled) {
                console.log('User cancelled the document picker');
            }
        } catch (err) {
            console.error('Error picking file:', err);
            Alert.alert('Error', 'Failed to pick the file. Please try again.');
        }
    };

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Document Uploads</Text>

            <Text style={styles.label}>Upload Aadhaar *</Text>
            <View style={styles.uploadContainer}>
                <TouchableOpacity 
                    style={[styles.uploadButton, {width: '100%'}]} 
                    onPress={() => handleDocumentUpload(setAadhaarFile, 'document')}
                >
                    <Text style={styles.uploadButtonText}>
                        {aadhaarFile ? '✅ Aadhaar Uploaded (Tap to change)' : '📁 Select Aadhaar from Gallery'}
                    </Text>
                </TouchableOpacity>
                <Text style={styles.hintText}>Please upload both front and back of your Aadhaar card</Text>
            </View>

            <Text style={styles.label}>Upload Pancard *</Text>
            <View style={styles.buttonRow}>
                <TouchableOpacity 
                    style={[styles.uploadButton, styles.halfButton]} 
                    onPress={() => handleDocumentUpload(setPancardFile, 'document')}
                >
                    <Text style={styles.uploadButtonText}>{pancardFile ? 'Pancard Uploaded' : 'Choose Pancard'}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.uploadButton, styles.halfButton, styles.cameraButton]} 
                    onPress={() => handleDocumentUpload(setPancardFile, 'image')}
                >
                    <Text style={styles.uploadButtonText}>📷 Camera</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.label}>Upload Highest Qualification Certificate *</Text>
            <View style={styles.buttonRow}>
                <TouchableOpacity 
                    style={[styles.uploadButton, styles.halfButton]} 
                    onPress={() => handleDocumentUpload(setQualificationFile, 'document')}
                >
                    <Text style={styles.uploadButtonText}>{qualificationFile ? 'Certificate Uploaded' : 'Choose Certificate'}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.uploadButton, styles.halfButton, styles.cameraButton]} 
                    onPress={() => handleDocumentUpload(setQualificationFile, 'image')}
                >
                    <Text style={styles.uploadButtonText}>📷 Camera</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        width: '100%',
        marginTop: height * 0.03,
        marginBottom: height * 0.02,
    },
    sectionTitle: {
        fontSize: width * 0.05,
        fontWeight: '700',
        color: '#333',
        marginBottom: height * 0.02,
        alignSelf: 'flex-start',
        marginLeft: width * 0.05,
    },
    label: {
        fontSize: width * 0.04,
        fontWeight: '600',
        marginTop: height * 0.02,
        color: '#333',
        alignSelf: 'flex-start',
        marginLeft: width * 0.05,
    },
    uploadContainer: {
        width: '100%',
        marginBottom: height * 0.02,
    },
    uploadButton: {
        height: height * 0.1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: width * 0.02,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    hintText: {
        fontSize: width * 0.03,
        color: '#666',
        marginTop: 5,
        marginLeft: 5,
    },
    uploadButtonText: {
        color: '#007AFF',
        fontSize: width * 0.035,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default UploadDocs;