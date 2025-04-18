
export async function detectLanguage(text: string): Promise<string> {
  // This is a simple mock implementation
  // In a real app, you would use a language detection service API
  
  // Basic detection for demonstration - detects some common languages
  const languages: Record<string, string[]> = {
    'en': ['the', 'is', 'and', 'to', 'hello', 'hi', 'how are you', 'what', 'where', 'when'],
    'es': ['el', 'la', 'que', 'hola', 'como estas', 'buenos dias', 'gracias'],
    'fr': ['le', 'la', 'je', 'bonjour', 'merci', 'comment', 'oui', 'non'],
    'de': ['der', 'die', 'das', 'und', 'hallo', 'guten tag', 'danke'],
    'it': ['il', 'la', 'che', 'ciao', 'grazie', 'buongiorno'],
    'pt': ['o', 'a', 'que', 'ola', 'obrigado', 'bom dia']
  };
  
  // Convert to lowercase for comparison
  const lowerText = text.toLowerCase();
  
  // Count word matches for each language
  const scores = Object.entries(languages).map(([lang, words]) => {
    let score = 0;
    for (const word of words) {
      if (lowerText.includes(word.toLowerCase())) {
        score++;
      }
    }
    return { lang, score };
  });
  
  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);
  
  // Return highest score, or default to 'en'
  return scores[0].score > 0 ? scores[0].lang : 'en';
}
