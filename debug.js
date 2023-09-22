import { windowManager } from 'node-window-manager';

const max = { x: 0, y: 25, width: 2560, height: 1415 };
const windows = windowManager.getWindows();
console.log(windows.map(v => ({
  title: v.getTitle(),
  bounds: v.getBounds(),
  isWindow: v.isWindow(),
  path: v.path,
})))


const notes = windows.find(v => v.getTitle() === 'Notes');
notes.show();
notes.bringToTop();
windowManager.requestAccessibility();
notes.setBounds({ x: 2018, y: 25, width: 542, height: 1415 });

windows.filter(v => v.getTitle() === 'zoom.us').forEach(v => {
  v.show();
  v.bringToTop();
  windowManager.requestAccessibility();
  v.setBounds({ x: 0, y: 25, width: 2018, height: 1415 });
})
