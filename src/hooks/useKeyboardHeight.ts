import { useState, useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Returns the current on-screen software keyboard height in logical pixels.
 * 0 when the keyboard is fully dismissed.
 *
 * iOS  — subscribes to keyboardWillShow/Hide for animation-frame accuracy.
 * Android — keyboardWillShow/Hide do not fire inside Modal windows; we use
 *            keyboardDidShow/Hide instead and apply the offset manually.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const isIOS   = Platform.OS === 'ios';
    const showEvt = isIOS ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = isIOS ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvt, (e) => setHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvt, ()  => setHeight(0));

    return () => { show.remove(); hide.remove(); };
  }, []);

  return height;
}
