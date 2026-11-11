I would like to create a mobile interface on an html page. Here is the requirements:

## Setup mode (default on page load)

1. Bottom Right Button: A "+" button positioned at the bottom right of the screen.
2. Adding Squares: Clicking the "+" button adds a new square with an incrementing number (starting from 1).
3. Draggable Squares: Each square should be draggable, allowing users to move it freely on the page.
4. Double-Click Editing: Double-clicking a square will make its text editable (like an input field) and select it so the user can directly type and overwrite the default value.
5. Click Outside to Save: Clicking outside the square after editing will revert it to a non-editable state.
6. Mode Switch: A check button ("✓") next to the plus button switches to chrono mode. In chrono mode it becomes a gear button ("⚙️") to switch back to setup mode.
7. Switching modes never resets the squares: the timers, background color and alarm state are kept, and running timers keep counting even in setup mode. In setup mode the timer lines are hidden, the squares stay draggable, and double-clicking a square allows editing its title.

## Chrono mode

Each square displays two lines: the text set up in setup mode (the square title, a bit bigger) and below it a chrono `mm:ss` starting at 00:00.

Colors: green `#4CAF50` (idle), blue `#2196F3` (running / alarm dismissed), orange `#FF9800` (alarm ≥ 0:30), red `#F44336` (alarm ≥ 1:00).

The alarm emoji (⏰) is displayed in the right corner of the square, independently of the title text (it is not part of the title).

1. Initial state: one timer fixed at 00:00 with a green background. This first timer counts the total time of the square once started.
2. First click: the first timer starts counting, the alarm emoji (⏰) is displayed, and the background turns blue.
3. While the alarm is active, the background turns orange after 0:30 and red after 1:00.
4. As soon as the square is clicked, the alarm is disabled (the ⏰ is removed), the background turns blue (if it was orange or red), and the first timer keeps running.
5. On the next click, a second timer is added below and starts directly, and the alarm emoji (⏰) is displayed again.
6. The alarm now applies to the second timer with the same thresholds: orange after 0:30, red after 1:00 of its own elapsed time.
7. On the next click, the alarm is disabled (⏰ removed), the second timer is reset to 00:00, and the background is set to blue again.
8. Clicking again restarts the second timer and re-activates the alarm, looping the behavior of steps 6–8.
9. Double-click resets the square to its initial state: one timer at 00:00, no ⏰, green background.
10. In this mode the text on the squares is read only and the cursor hovering them should not be of type "move".


TODO:
- add a configuration menu, activated with a button a the botom left corner of the screen in this menu there should be 3 settings configurable: (the zoom level of the page, the time for the orange alarm and the red alarm). Clicking back to the button close that menu. Updating the value should directly taken into account, there is no save button.