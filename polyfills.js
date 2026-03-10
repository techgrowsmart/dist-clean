// Polyfill for localStorage in web environment
if (typeof window !== 'undefined') {
  if (!window.localStorage) {
    const storage = {};
    window.localStorage = {
      getItem: function(key) {
        return storage[key] || null;
      },
      setItem: function(key, value) {
        storage[key] = value;
      },
      removeItem: function(key) {
        delete storage[key];
      },
      clear: function() {
        Object.keys(storage).forEach(key => delete storage[key]);
      },
      get length() {
        return Object.keys(storage).length;
      },
      key: function(index) {
        return Object.keys(storage)[index] || null;
      }
    };
  }

  // Polyfill for sessionStorage if needed
  if (!window.sessionStorage) {
    const sessionStorage = {};
    window.sessionStorage = {
      getItem: function(key) {
        return sessionStorage[key] || null;
      },
      setItem: function(key, value) {
        sessionStorage[key] = value;
      },
      removeItem: function(key) {
        delete sessionStorage[key];
      },
      clear: function() {
        Object.keys(sessionStorage).forEach(key => delete sessionStorage[key]);
      },
      get length() {
        return Object.keys(sessionStorage).length;
      },
      key: function(index) {
        return Object.keys(sessionStorage)[index] || null;
      }
    };
  }
}

// Polyfill for console methods if missing
if (typeof console !== 'undefined') {
  if (!console.log) console.log = () => {};
  if (!console.warn) console.warn = () => {};
  if (!console.error) console.error = () => {};
}
