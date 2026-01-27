// Client-side implementation of the name generator
// This version works entirely in the browser without a server

import { IDENTITY_WORDS } from '../utils/DefaultParameters';

// Word lists from centralized config
const adjectives = IDENTITY_WORDS.ADJECTIVES;
const nouns = IDENTITY_WORDS.NOUNS;
  
  // Generate a random number ID of specified length
  function generateNumericId(length = 6) {
    let result = '';
    const characters = '0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  
  // Generate an alphanumeric ID of specified length
  function generateAlphanumericId(length = 8) {
    let result = '';
    const characters = '0123456789abcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  
  // Generate a timestamp-based ID with additional random characters
  function generateTimestampId(length = 4) {
    // Get current timestamp (last 6 digits)
    const timestamp = Date.now().toString().slice(-6);
    
    // Add random characters to ensure uniqueness
    let randomPart = '';
    const characters = '0123456789abcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      randomPart += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    
    return timestamp + randomPart;
  }
  
  // Generate a random name by combining an adjective, a noun, and a unique identifier
  function generateRandomName(options = {}) {
    const { idType = 'numeric', idLength = 6 } = options;
    
    // Get random adjective and noun
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    
    // Generate unique ID based on specified type
    let uniqueId;
    switch (idType) {
      case 'alphanumeric':
        uniqueId = generateAlphanumericId(idLength);
        break;
      case 'timestamp':
        uniqueId = generateTimestampId(idLength);
        break;
      case 'numeric':
      default:
        uniqueId = generateNumericId(idLength);
        break;
    }
    
    // Combine components to create the final name
    return `${randomAdjective}${randomNoun}${uniqueId}`;
  }

  // Generate multiple random names with numeric IDs of fixed length 6
  function generateRandomNames(count = 3) {
    const names = [];
    for (let i = 0; i < count; i++) {
      names.push(generateRandomName({ idType: 'numeric', idLength: 6 }));
    }
    return names;
  }

  // Generate a standard UUID
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  export { generateRandomName, generateRandomNames, generateUUID };