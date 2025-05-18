import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Ionicons from '@expo/vector-icons/Ionicons';

// Types
interface Conversation {
  _id: string;
  userId: string;
  name: string;
  createdAt: string;
}

interface Message {
  _id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

const App = () => {
  // State
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [chats, setChats] = useState<Conversation[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  // Config
  const BACKEND_URL = 'http://10.25.254.185:5000'; // Replace with your backend IP
  const flatListRef = useRef<FlatList>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // In a real app, get userId from authentication
      const userId = "lausd_parent_123"; 
      const res = await axios.get(`${BACKEND_URL}/api/users/${userId}/conversations`);
      setChats(res.data as Conversation[]);
    } catch (err) {
      Alert.alert("Error", "No se pudieron cargar las conversaciones");
    }
  };

  // Create new conversation
  const createNewChat = async () => {
    try {
      const userId = "lausd_parent_123";
      const res = await axios.post<{ insertedId: string }>(`${BACKEND_URL}/api/conversations`, {
        userId,
        initialMessage: "¡Hola! ¿En qué puedo ayudarle hoy?",
        language: 'es'
      });

      const newChat = {
        _id: res.data.insertedId,
        userId,
        name: `Nueva conversación - ${new Date().toLocaleDateString('es-MX')}`,
        createdAt: new Date().toISOString()
      };

      setCurrentChatId(newChat._id);
      setChats([newChat, ...chats]);
      setMessages([{
        _id: uuidv4(),
        text: "¡Hola! ¿En qué puedo ayudarle hoy?",
        sender: 'ai',
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      Alert.alert("Error", "No se pudo crear la conversación");
    }
  };

  // Send message to backend
  const sendMessage = async () => {
    if (!input.trim() || !currentChatId) return;

    const userMessage = {
      _id: uuidv4(),
      text: input,
      sender: 'user' as const,
      timestamp: new Date().toISOString()
    };

    setIsSending(true);
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      // 1. Save user message
      await axios.post(`${BACKEND_URL}/api/conversations/${currentChatId}/messages`, {
        text: input,
        sender: 'user',
        language: 'es'
      });

      // 2. Get AI response (LAUSD-specific)
      const aiRes = await axios.post<{ translation: string }>(`${BACKEND_URL}/api/ai/process`, {
        message: input,
        conversationId: currentChatId,
        context: "LAUSD_non_traditional_high_school"
      });

      // 3. Add AI response
      setMessages(prev => [
        ...prev, 
        {
          _id: uuidv4(),
          text: aiRes.data.translation,
          sender: 'ai',
          timestamp: new Date().toISOString()
        }
      ]);

    } catch (err) {
      Alert.alert("Error", "No se pudo enviar el mensaje");
      setInput(userMessage.text); // Restore message
    } finally {
      setIsSending(false);
    }
  };

  // UI Components
  const MessageBubble = ({ message }: { message: Message }) => (
    <View style={[
      styles.bubble,
      message.sender === 'user' ? styles.userBubble : styles.aiBubble
    ]}>
      <Text style={message.sender === 'user' ? styles.userText : styles.aiText}>
        {message.text}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>LAUSD - Asistente para Padres</Text>
        <TouchableOpacity onPress={createNewChat}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Input Area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Escriba su pregunta..."
          placeholderTextColor="#888"
          style={styles.input}
          editable={!!currentChatId}
          multiline
        />
        <TouchableOpacity 
          onPress={sendMessage} 
          disabled={!input || isSending}
          style={styles.sendButton}
        >
          {isSending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a56db', // LAUSD blue
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1a56db',
    borderBottomRightRadius: 0,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e7eb',
    borderBottomLeftRadius: 0,
  },
  userText: {
    color: 'white',
  },
  aiText: {
    color: '#111827',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 8,
    color: '#111827',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a56db',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;