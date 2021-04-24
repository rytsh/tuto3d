const shrinkElement = (elmnt: HTMLElement, move:HTMLElement, Y: boolean | undefined) => {
  let posY = 0;
  let posChangeY = 0;
  let posX = 0;
  let posChangeX = 0;

  move.onmousedown = dragMouseDown;

  function dragMouseDown(e:MouseEvent) {
    e.preventDefault();
    // get the mouse cursor position at startup
    if (Y === undefined) {
      posY = e.clientY;
      posX = e.clientX;
    } else {
      if (Y) {
        posY = e.clientY;
      } else {
        posX = e.clientX;
      }
    }
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves
    document.onmousemove = elementDrag;
  }

  function elementDrag(e:MouseEvent) {
    e.preventDefault();
    // calculate the new cursor position
    if (Y === undefined) {
      posChangeY = posY - e.clientY;
      posY = e.clientY;
      posChangeX = posX - e.clientX;
      posX = e.clientX;
    } else {
      if (Y) {
        posChangeY = posY - e.clientY;
        posY = e.clientY;
      } else {
        posChangeX = posX - e.clientX;
        posX = e.clientX;
      }
    }
    // set the element's new position
    if (Y === undefined) {
      elmnt.style.height = `${elmnt.offsetHeight - posChangeY}px`;
      elmnt.style.width = `${elmnt.offsetWidth - posChangeX}px`;
    } else {
      if (Y) {
        elmnt.style.height = `${elmnt.offsetHeight - posChangeY}px`;
      } else {
        elmnt.style.width = `${elmnt.offsetWidth - posChangeX}px`;
      }
    }
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
};

const moveElement = (elmnt: HTMLElement, move:HTMLElement, main:HTMLElement) => {
  let pos1 = 0; let pos2 = 0; let pos3 = 0; let pos4 = 0;

  let maxW = 0;
  let maxH = 0;

  const gap = 2;

  move.onmousedown = dragMouseDown;

  function dragMouseDown(e:MouseEvent) {
    e.preventDefault();
    // get the mouse cursor position at startup
    pos3 = e.clientX;
    pos4 = e.clientY;

    maxH = Math.floor(main.offsetHeight) - gap;
    maxW = Math.floor(main.offsetWidth) - gap;

    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves
    document.onmousemove = elementDrag;
  }

  function elementDrag(e:MouseEvent) {
    e.preventDefault();
    // calculate the new cursor position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position
    const top = elmnt.offsetTop - pos2;
    const left= elmnt.offsetLeft - pos1;
    elmnt.style.top = (top > gap ? Math.ceil(elmnt.offsetHeight) + top < maxH ? top : maxH - Math.floor(elmnt.offsetHeight) : gap) + "px";
    elmnt.style.left = (left > gap ? Math.ceil(elmnt.offsetWidth) + left < maxW ? left : maxW - Math.floor(elmnt.offsetWidth) : gap) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released
    document.onmouseup = null;
    document.onmousemove = null;
  }
};

export { shrinkElement, moveElement };
