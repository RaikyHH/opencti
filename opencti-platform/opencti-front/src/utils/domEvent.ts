import { MouseEvent, UIEvent } from 'react';

const stopEvent = (event: UIEvent) => {
  event.stopPropagation();
  event.preventDefault();
};

// event.button 1 handles middleButton mouse click
export const isOpenInNewTabMouseEvent = (event: MouseEvent) => event.ctrlKey || event.metaKey || event.button === 1;

export default stopEvent;
