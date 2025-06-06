import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  Keyboard
} from 'react-native';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Ionicons from '@expo/vector-icons/Ionicons';
import Sidebar from './Sidebar'; // Make sure the path is correct
import { Stack } from 'expo-router';

// Types
interface Conversation {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

const App = () => {
  // State
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [chats, setChats] = useState<Conversation[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  
  // Config
  const CHAT_SERVER_URL = 'http://192.168.1.78:5000';
  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);
const api = axios.create({
  baseURL: 'http://192.168.1.78:5000', // or :8000 for Python
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Example async function to use the api client
const sendTestMessage = async () => {
  try {
    const response = await api.post('/api/conversations/123/messages', {
      text: input,
      sender: 'user'
    });
    // handle response if needed
  } catch (err: any) {
    if (err.response?.status === 403) {
      Alert.alert("Error", "You don't have permission to access this resource");
    }
  }
};

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const userId = "lausd_parent_123";
      const res = await axios.get<Conversation[]>(`${CHAT_SERVER_URL}/api/users/${userId}/conversations`);
      setChats(res.data);
      
      if (res.data.length > 0) {
        setCurrentChatId(res.data[0].id);
        loadConversationMessages(res.data[0].id);
      }
    } catch (err) {
      Alert.alert("Error", "Could not load conversations");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      setIsLoading(true);
      const res = await axios.get<Message[]>(`${CHAT_SERVER_URL}/api/conversations/${conversationId}/messages`);
      setMessages(res.data);
    } catch (err) {
      Alert.alert("Error", "Could not load messages");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = async () => {
    try {
      setIsLoading(true);
      const userId = "lausd_parent_123";
      const res = await axios.post<{ insertedId: string }>(`${CHAT_SERVER_URL}/api/conversations`, {
        userId,
        initialMessage: "¡Hola! ¿En qué puedo ayudarle hoy?",
        language: 'es'
      });

      const newChat = {
        id: res.data.insertedId,
        userId,
        name: `New Conversation - ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toISOString()
      };

      setCurrentChatId(newChat.id);
      setChats([newChat, ...chats]);
      setMessages([{
        id: uuidv4(),
        text: "¡Hola! ¿En qué puedo ayudarle hoy?",
        sender: 'bot',
        timestamp: new Date().toISOString()
      }]);
      
      setTimeout(() => textInputRef.current?.focus(), 100);
      setIsSidebarVisible(false); // Close sidebar after creating new chat
    } catch (err) {
      Alert.alert("Error", "Could not create conversation");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      setIsLoading(true);
      await axios.delete(`${CHAT_SERVER_URL}/api/conversations/${chatId}`);
      
      setChats(chats.filter(chat => chat.id !== chatId));
      
      if (currentChatId === chatId) {
        if (chats.length > 1) {
          const newCurrentChat = chats.find(chat => chat.id !== chatId);
          if (newCurrentChat) {
            setCurrentChatId(newCurrentChat.id);
            loadConversationMessages(newCurrentChat.id);
          }
        } else {
          setCurrentChatId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      Alert.alert("Error", "Could not delete conversation");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    Keyboard.dismiss();
    
    if (!input.trim()) {
      Alert.alert("Error", "Please enter a message");
      return;
    }

    if (!currentChatId) {
      Alert.alert("Error", "Please select or create a conversation first");
      return;
    }

    const userMessage = {
      id: uuidv4(),
      text: input,
      sender: 'user' as const,
      timestamp: new Date().toISOString()
    };

    setIsSending(true);
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      // Save user message and get bot response
      const res = await axios.post(`${CHAT_SERVER_URL}/api/conversations/${currentChatId}/messages`, {
        text: input,
        sender: 'user',
        language: 'es'
      });

      // Type assertion for res.data
      const data = res.data as { messages: { sender: string; content: string }[] };
      const lastMessage = data.messages[data.messages.length - 1];
      if (lastMessage.sender === 'bot') {
        setMessages(prev => [...prev, {
          id: uuidv4(),
          text: lastMessage.content,
          sender: 'bot',
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      Alert.alert("Error", "Failed to send message");
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      setInput(userMessage.text);
    } finally {
      setIsSending(false);
    }
  };

  const MessageBubble = ({ message }: { message: Message }) => (
    <View style={[
      styles.bubble,
      message.sender === 'user' ? styles.userBubble : styles.botBubble
    ]}>
      <Text style={message.sender === 'user' ? styles.userText : styles.botText}>
        {message.text}
      </Text>
      <Text style={styles.timestamp}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  if (isLoading && chats.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a56db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Sidebar */}
      <Sidebar
        isVisible={isSidebarVisible}
        chats={chats.map(chat => ({ _id: chat.id, name: chat.name }))}
        onSelectChat={(chatId) => {
          setCurrentChatId(chatId);
          loadConversationMessages(chatId);
          setIsSidebarVisible(false);
        }}
        onCreateNewChat={createNewChat}
        onDeleteChat={deleteChat}
        onClose={() => setIsSidebarVisible(false)}
      />

      {/* Main Content */}
      <View style={[styles.mainContent, isSidebarVisible && styles.shiftedContent]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsSidebarVisible(true)}>
            <Ionicons name="menu" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>LAUSD Parent Assistant</Text>
          <TouchableOpacity onPress={createNewChat}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => <MessageBubble message={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet. Start a conversation!</Text>
            </View>
          }
        />

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <TextInput
            ref={textInputRef}
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            placeholderTextColor="#888"
            style={styles.input}
            editable={!!currentChatId && !isSending}
            multiline
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!input.trim() || isSending}
            style={[
              styles.sendButton,
              (!input.trim() || isSending) && styles.disabledButton
            ]}
          >
            {isSending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

// Enhanced Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mainContent: {
    flex: 1,
  },
  shiftedContent: {
    marginLeft: '80%', // Same as sidebar width
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a56db',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  messagesContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
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
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e7eb',
    borderBottomLeftRadius: 0,
  },
  userText: {
    color: 'white',
  },
  botText: {
    color: '#111827',
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: 'white',
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
  disabledButton: {
    backgroundColor: '#cccccc',
  },
});

export default App;