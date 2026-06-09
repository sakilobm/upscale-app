import { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

interface UseCachedFontsReturn {
  fontsLoaded: boolean;
  fontError: Error | null;
}

export function useCachedFonts(): UseCachedFontsReturn {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontError, setFontError] = useState<Error | null>(null);

  useEffect(() => {
    Font.loadAsync({
      Poppins_400Regular,
      Poppins_500Medium,
      Poppins_600SemiBold,
      Poppins_700Bold,
      Poppins_800ExtraBold,
      Inter_400Regular,
      Inter_500Medium,
      Inter_600SemiBold,
      Inter_700Bold,
    })
      .then(() => setFontsLoaded(true))
      .catch((err: Error) => setFontError(err));
  }, []);

  return { fontsLoaded, fontError };
}
