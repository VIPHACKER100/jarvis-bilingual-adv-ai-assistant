import { CommandResult, ContactsMap } from '../types';

export const processCommand = (transcript: string, contacts: ContactsMap): CommandResult => {
  const lowerTranscript = transcript.toLowerCase();

  // 1. System Diagnostics
  if (lowerTranscript.includes('system report') || lowerTranscript.includes('diagnostics') || lowerTranscript.includes('status report')) {
    return {
      action: 'SYSTEM_REPORT',
      description: 'Running System Diagnostics',
      response: 'All systems nominal. Power levels at 100%. Network connection stable. CPU temperature optimal. Ready for instruction.'
    };
  }

  // 2. Web Navigation
  if (lowerTranscript.includes('open') || lowerTranscript.includes('go to') || lowerTranscript.includes('navigate to')) {
    let site = lowerTranscript.replace(/open|go to|navigate to/g, '').trim();
    site = site.replace(/\./g, '');
    let url = `https://www.${site.replace(/\s/g, '')}.com`;
    
    if (site.includes('youtube')) url = 'https://www.youtube.com';
    if (site.includes('google')) url = 'https://www.google.com';
    
    return {
      action: 'NAVIGATE',
      target: url,
      payload: site,
      description: `Opening ${site}`,
      response: `Navigating to ${site}`
    };
  }

  // 3. YouTube Search
  if (lowerTranscript.includes('play') && lowerTranscript.includes('youtube')) {
    const query = lowerTranscript.replace('play', '').replace('on youtube', '').trim();
    return {
      action: 'YOUTUBE_SEARCH',
      target: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      payload: query,
      description: `Searching YouTube for "${query}"`,
      response: `Playing ${query} on YouTube`
    };
  }

  // 4. General Google Search
  if (lowerTranscript.includes('search for') || (lowerTranscript.includes('google') && !lowerTranscript.includes('open'))) {
    const query = lowerTranscript.replace('search for', '').replace('google', '').trim();
    if (query) {
      return {
        action: 'GOOGLE_SEARCH',
        target: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        payload: query,
        description: `Googling "${query}"`,
        response: `Searching the web for ${query}`
      };
    }
  }

  // 5. Calculator / Math
  if (lowerTranscript.includes('calculate') || lowerTranscript.includes('what is')) {
    let expression = lowerTranscript
      .replace('calculate', '')
      .replace('what is', '')
      .replace('plus', '+')
      .replace('minus', '-')
      .replace('times', '*')
      .replace('multiplied by', '*')
      .replace('divided by', '/')
      .replace(/x/g, '*') // common mistake for multiplication
      .trim();

    // Remove non-math characters (security)
    const sanitized = expression.replace(/[^0-9+\-*/().]/g, '');

    try {
      // ponytail: safe math, no eval
      const safeCalculate = (expr: string): number => {
        const tokens = expr.match(/(\d+\.?\d*|[+\-*/().])/g) || [];
        let pos = 0;

        const parseExpr = (): number => {
          let result = parseTerm();
          while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
            const op = tokens[pos++];
            const rhs = parseTerm();
            result = op === '+' ? result + rhs : result - rhs;
          }
          return result;
        };

        const parseTerm = (): number => {
          let result = parseFactor();
          while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
            const op = tokens[pos++];
            const rhs = parseFactor();
            if (op === '/') {
              if (rhs === 0) throw new Error('Division by zero');
              result /= rhs;
            } else {
              result *= rhs;
            }
          }
          return result;
        };

        const parseFactor = (): number => {
          if (tokens[pos] === '(') {
            pos++;
            const result = parseExpr();
            if (tokens[pos] === ')') pos++;
            return result;
          }
          if (tokens[pos] === '-') {
            pos++;
            return -parseFactor();
          }
          return parseFloat(tokens[pos++]) || 0;
        };

        const result = parseExpr();
        if (pos !== tokens.length) throw new Error('Unexpected tokens');
        return result;
      };

      const result = safeCalculate(sanitized);

      if (!isNaN(result) && sanitized.length > 0) {
        return {
          action: 'CALCULATOR',
          payload: result,
          description: `Calculating: ${sanitized}`,
          response: `The answer is ${result}`
        };
      }
    } catch (e) {
      // If eval fails, fall through to unknown
    }
  }

  // 6. WhatsApp
  if (lowerTranscript.includes('send message to')) {
    const match = lowerTranscript.match(/send message to (.+?) saying (.+)/);
    
    if (match) {
      const contactName = match[1].trim().toUpperCase();
      const messageContent = match[2].trim();
      
      const phoneNumber = contacts[contactName];
      
      if (phoneNumber) {
        return {
          action: 'WHATSAPP_MESSAGE',
          target: `https://wa.me/${phoneNumber}?text=${encodeURIComponent(messageContent)}`,
          payload: { name: contactName, number: phoneNumber, message: messageContent },
          description: `Sending WhatsApp to ${contactName}`,
          response: `Preparing message for ${contactName}`
        };
      } else {
        return {
          action: 'UNKNOWN',
          description: `Contact ${contactName} not found`,
          response: `Contact ${contactName} not found in database.`
        };
      }
    }
  }

  // 7. Time & Date
  if (lowerTranscript.includes('time')) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      action: 'TIME_DATE',
      description: 'Check Time',
      response: `The current time is ${time}`
    };
  }
  
  if (lowerTranscript.includes('date') || lowerTranscript.includes('day')) {
    const date = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return {
      action: 'TIME_DATE',
      description: 'Check Date',
      response: `Today is ${date}`
    };
  }

  // 8. Volume
  if (lowerTranscript.includes('volume')) {
    if (lowerTranscript.includes('increase') || lowerTranscript.includes('up') || lowerTranscript.includes('raise')) {
      return {
        action: 'VOLUME_CONTROL',
        payload: 'UP',
        description: 'Increasing Volume',
        response: 'Simulating volume increase.'
      };
    }
    if (lowerTranscript.includes('decrease') || lowerTranscript.includes('down') || lowerTranscript.includes('lower')) {
      return {
        action: 'VOLUME_CONTROL',
        payload: 'DOWN',
        description: 'Decreasing Volume',
        response: 'Simulating volume decrease.'
      };
    }
  }

  // Default
  return {
    action: 'UNKNOWN',
    description: 'Unknown Command',
    response: 'I did not catch that command.'
  };
};