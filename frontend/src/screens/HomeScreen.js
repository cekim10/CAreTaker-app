import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import Voice from '@react-native-community/voice';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import Features from '../components/features';
import Tts from 'react-native-tts';
// import addToIosCalendar from "./calendarhelp.js"

const App = () => {
  const [result, setResult] = useState('');
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const scrollViewRef = useRef();

  const url1 = "https://github.com/vishal-pawar";
  const url2 = "abcd://abcd.com";
  const number = '+910987654321'
  const message = "hello there!!"

  const sendTextMessage = useCallback(async (phNumber, message) => {
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:${phNumber}${separator}body=${message}`;
    await Linking.openURL(url);
  }, []);

  const speechStartHandler = (e) => {
    console.log('speech start event', e);
  };

  const speechEndHandler = (e) => {
    setRecording(false);
    console.log('speech stop event', e);
  };

  const speechResultsHandler = (e) => {
    console.log('speech event: ', e);
    const text = e.value[0];
    setResult(text);
  };

  const speechErrorHandler = (e) => {
    console.log('speech error: ', e);
  };

  const startRecording = async () => {
    setRecording(true);
    Tts.stop();
    try {
      await Voice.start('en-US');
    } catch (error) {
      console.log('error', error);
    }
  };

  const stopRecording = async () => {
    try {
      await Voice.stop();
      setRecording(false);
      fetchResponse();
    } catch (error) {
      console.log('error', error);
    }
  };

  const clear = () => {
    Tts.stop();
    setSpeaking(false);
    setLoading(false);
    setMessages([]);
  };

  const fetchResponse = async () => {
    if (result.trim().length > 0) {
      setLoading(true);
      let newMessages = [...messages];
      newMessages.push({ role: 'user', content: result.trim() });
      setMessages([...newMessages]);
  
      // Sending text to Flask server
      try {
        const response = await fetch('http://127.0.0.1:5001/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: result.trim() }), // Sending the text as a JSON object
        });
        const data = await response.json();
        if (response.ok) {
          console.log(response);
          if (data.gpt_response === "open_youtube") {
            // Open YouTube app
            const youtubeUrl = 'https://www.youtube.com/';
            const supported = await Linking.canOpenURL(youtubeUrl);
            if (supported) {
              await Linking.openURL(youtubeUrl);
            } else {
              Alert.alert('Error', 'The YouTube app is not supported on this device.');
            }
          } else if (data.gpt_response === "open_calendar") {
            // Open Calendar app
            const calendarUrl = 'calshow://';
            const supported = await Linking.canOpenURL(calendarUrl);
            if (supported) {
              await Linking.openURL(calendarUrl);
            } else {
              Alert.alert('Error', 'The Calendar app is not supported on this device.');
            }
          } 
          else if (data.gpt_response === "open_photos") {
            // Open Photos (iOS)
            Linking.openURL("photos-redirect://");
          } else if (data.gpt_response === "open_settings") {
            // Open Settings
            const settingsUrl = 'app-settings://';
            const supported = await Linking.canOpenURL(settingsUrl);
            if (supported) {
              await Linking.openURL(settingsUrl);
            } else {
              Alert.alert('Error', 'The Settings app is not supported on this device.');
            }
          } else if (data.gpt_response === "open_maps") {
            // Open Maps (iOS)
            const mapsUrl = 'maps://';
            const supported = await Linking.canOpenURL(mapsUrl);
            if (supported) {
              await Linking.openURL(mapsUrl);
            } else {
              Alert.alert('Error', 'Maps are not supported on this device.');
            }
          }
          else if (data.gpt_response === "open_sms"){
            sendTextMessage(number, message);
          }
          else if (data.gpt_response === "open_reminders") {
            // Open Reminders (iOS)
            const remindersUrl = 'x-apple-reminder://';
            const supported = await Linking.canOpenURL(remindersUrl);
            if (supported) {
                await Linking.openURL(remindersUrl);
            } else {
                Alert.alert('Error', 'The Reminders app is not supported on this device.');
            }
          } 
          else {
            // Push the normal response to the messages
            newMessages.push({ role: 'assistant', content: data.gpt_response });
            setMessages([...newMessages]);
            updateScrollView();
            startTextToSpeech(data.gpt_response);
          }
        } else {
          Alert.alert('Error', data.error);
        }
      } catch (error) {
        console.error('Error:', error);
        Alert.alert('Error', 'Failed to communicate with the server.');
      } finally {
        setLoading(false);
        setResult('');
      }
    }
  };
  
  
  

  const updateScrollView = () => {
    setTimeout(() => {
      scrollViewRef?.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  const startTextToSpeech = (message) => {
    if (!message.includes('https')) {
      console.log("here?")
      console.log(message)
      setSpeaking(true);
      Tts.speak(message, {
        iosVoiceId: 'com.apple.speech.synthesis.voice.Fred',
        rate: 0.5,
      });
    }
  };

  const stopSpeaking = () => {
    Tts.stop();
    setSpeaking(false);
  };

  useEffect(() => {
    // Voice handler events
    Voice.onSpeechStart = speechStartHandler;
    Voice.onSpeechEnd = speechEndHandler;
    Voice.onSpeechResults = speechResultsHandler;
    Voice.onSpeechError = speechErrorHandler;

    // Text to speech events
    Tts.setDefaultLanguage('en-IE');
    Tts.addEventListener('tts-start', (event) => console.log('start', event));
    Tts.addEventListener('tts-finish', (event) => {
      console.log('finish', event);
      setSpeaking(false);
    });
    Tts.addEventListener('tts-cancel', (event) => console.log('cancel', event));

    return () => {
      // Destroy the voice instance after component unmounts
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  return (
    <View className="flex-1 bg-white" style={{flex: 1, backgroundColor: '#9b59b6'}}>
      <SafeAreaView className="flex-1 flex mx-5">
        {/* Bot icon */}
        <View className="flex-row justify-center">
          <Image
            source={require('../../assets/images/catIcon.png')}
            style={{ height: hp(15), width: hp(18) }}
          />
        </View>

        {/* Features or message history */}
        {messages.length > 0 ? (
          <View className="space-y-2 flex-1">
            <Text className="text-white-700 font-semibold ml-1" style={{ fontSize: wp(5) }}>
              Assistant
            </Text>

            <View style={{ height: hp(58) }} className="bg-neutral-200 rounded-3xl p-4">
              <ScrollView
                ref={scrollViewRef}
                bounces={false}
                className="space-y-4"
                showsVerticalScrollIndicator={false}>
                {messages.map((message, index) => {
                  if (message.role === 'assistant') {
                    return (
                      <View key={index} style={{ width: wp(70) }} className="bg-emerald-100 p-2 rounded-xl rounded-tl-none">
                        <Text className="text-neutral-800" style={{ fontSize: wp(4) }}>
                          {message.content}
                        </Text>
                      </View>
                    );
                  } else {
                    return (
                      <View key={index} className="flex-row justify-end">
                        <View style={{ width: wp(70) }} className="bg-white p-2 rounded-xl rounded-tr-none">
                          <Text style={{ fontSize: wp(4) }}>{message.content}</Text>
                        </View>
                      </View>
                    );
                  }
                })}
              </ScrollView>
            </View>
          </View>
        ) : (
          <Features />
        )}

        {/* Recording, clear, and stop buttons */}
        <View className="flex justify-center items-center">
          {loading ? (
            <Image
              source={require('../../assets/images/loading.gif')}
              style={{ width: hp(10), height: hp(10) }}
            />
          ) : recording ? (
            <TouchableOpacity className="space-y-2" onPress={stopRecording}>
              {/* Recording stop button */}
              <Image
                className="rounded-full"
                source={require('../../assets/images/voiceLoading.gif')}
                style={{ width: hp(10), height: hp(10) }}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={startRecording}>
              {/* Recording start button */}
              <Image
                className="rounded-full"
                source={require('../../assets/images/recordingIcon.png')}
                style={{ width: hp(10), height: hp(10) }}
              />
            </TouchableOpacity>
          )}
          {messages.length > 0 && (
            <TouchableOpacity onPress={clear} className="bg-neutral-400 rounded-3xl p-2 absolute right-10">
              <Text className="text-white font-semibold">Clear</Text>
            </TouchableOpacity>
          )}
          {speaking && (
            <TouchableOpacity onPress={stopSpeaking} className="bg-red-400 rounded-3xl p-2 absolute left-10">
              <Text className="text-white font-semibold">Stop</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

export default App;