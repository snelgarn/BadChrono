I would like to create a mobile interface on an html page. Here is the requirements:



When loading the page, when start with a setup mode:

1. Bottom Right Button: A "+" button positioned at the bottom right of the screen.
2. Adding Squares: Clicking the "+" button adds a new square with an incrementing number (starting from 1).
3. Draggable Squares: Each square should be draggable, allowing users to move it freely on the page.
4. Double-Click Editing: Double-clicking a square will make its number editable (like an input field) and select it so the so the user can directly type and overwrite the default value.
5. Click Outside to Save: Clicking outside the square after editing will revert it to a non-editable state.


Next to the plus button, there should be a check button, when clicking on that we switch on the chrono mode. To go back in the setup mode there should be a gear button. Here are the requirement of the chrono mode:
1. The square are now with two line, the text we setup before is the name of that square and is a bit bigger and bellow there is a chrono mm:ss at 00:00.
2. When we click on a square the chrono start counting secconds and minutes.
3. when clicking a second time a new line will be added with another chrono starting while the above one will contine
4. clicking a thrid time will reset and start the second chrono while keeping the first one running
5. double click will reset the square to the inital state, with only one chrono with the value 00:00
6. in that mode the text on the square are read only and the cursor hovering it should not be of type "move" 



TODO:
- [x] refactor the code to use the "square-title" for the text on the square instead of "square-name" and "title" instead of "originalText"