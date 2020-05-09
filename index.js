// BASE 
const base = (function() {
    return {
        elements: { //list of DOM elements to be selected in other modules
            'rgbDisplay': document.querySelector('.header__rgb-value'),
            'difficulty': document.querySelector('.settings__difficulty'),
            'gameField': document.querySelector('.game-field'),
            'winDisplay': document.querySelector('.header__win-display'),
            'header': document.querySelector('.header'),
            'reroll': document.querySelector('.btn__reroll'),
            'btnSettings': document.querySelectorAll('.btn__settings'),
            'hint': document.querySelector('.btn__hint'),
            'reset': document.querySelector('.btn__reset')
        }
    }
})();


// MODEL
const model = (function() {
    const calcRGBvalue = function() { //calculate a random RGB
        return {
            'red': Math.floor(Math.random() * 256),
            'green': Math.floor(Math.random() * 256),
            'blue': Math.floor(Math.random() * 256)
        }
    };

    return {
        calcRGBvalue,
        createSquaresData: function(number) {
            const squareArrays = [];
            for (let i = 0; i < number; i++) {
                squareArrays.push(calcRGBvalue());
            }
            return squareArrays;
        }
    }
})();



//VIEW 
const view = (function() {
    const getDifficultyLevel = function() {
        return base.elements.difficulty.value;
    }

    const displayColour =  function(el, colourObj) {
        el.style.backgroundColor = `rgb(${colourObj.red}, ${colourObj.green}, ${colourObj.blue})`;
    }

    return {
        displayRGBvalue: function(gameRGBvalue) { //display RGB value in the heading and make it appear (initially hidden)
            base.elements.rgbDisplay.textContent = `RGB(${gameRGBvalue.red}, ${gameRGBvalue.green}, ${gameRGBvalue.blue})`;
            base.elements.rgbDisplay.classList.add('header__rgb-value--shown');
        },
        getDifficultyNumOfSq: function() {
            const difficultyLevel = getDifficultyLevel();
            if (difficultyLevel === 'easy') {
                return 3;
            } else if (difficultyLevel === 'medium') {
                return 6;
            } else {
                return 9;
            }
        },
        displayColour,
        displaySquares: function(array) { //displaying the squares inside the field
            array.forEach((el, i) => {
                const markup = `
                    <button class="btn btn__game-field" data-squareNum="${i}" data-answer="false"></button>
                `;
                base.elements.gameField.insertAdjacentHTML('beforeend', markup);
            });

            document.querySelectorAll('.btn__game-field').forEach((el, i) => {
                const currentColour = array[i];
                el.style.backgroundColor = `rgb(${currentColour.red}, ${currentColour.green}, ${currentColour.blue})`;
            })
        },
        changeOneToCorrectSquare: function(answerObj, numberOfSquares) {
            const randomSquareNum = Math.floor(Math.random() * numberOfSquares);
            const sqToChange = document.querySelector(`[data-squareNum ="${randomSquareNum}"]`);
            sqToChange.dataset.answer = 'true';
            displayColour(sqToChange, answerObj);
        },
        setActiveGameState: function() {
            // disable difficulty selection
            base.elements.difficulty.setAttribute('disabled', '');
        },
        endGameState: function() {
            //show off restart button (which has its own event listener), and hide reroll and hint btns
            base.elements.reset.style.display = 'inline-block';
            base.elements.reroll.style.display = 'none';
            base.elements.hint.classList.add('btn__hint--hidden');
        }
    }
})();


// CONTROLLER
const controller = (function() {
    let gameRGBvalue, numSquares; //for the sake of displayCorrectSq function, to review if needed

    //Setting up all event listeners
    const setUpEventListeners = function() {
        //event delegation for all game squares
        base.elements.gameField.addEventListener('click', event => {
            const curElement = event.target;
            if(curElement.className === 'btn btn__game-field') {
                const squareRGBvalue = curElement.attributes.getNamedItem('style').nodeValue.replace('background-color: rgb', '');
                const squareRGBstring = squareRGBvalue.replace(';', '');
                const gameRGBstring = base.elements.rgbDisplay.textContent.replace('RGB', '');

                //check if rgb of square was game rgb value
                if (squareRGBstring !== gameRGBstring) {
                    curElement.classList.add('btn__game-field--hidden');  // if not correct square, visibility: hidden
                    
                    // set game to active
                    view.setActiveGameState();
                } else {
                    // if yes, print winning message
                    base.elements.winDisplay.classList.add('header__win-display--shown');
                    // all squares visibility back up
                    document.querySelectorAll('.btn__game-field').forEach(cur => {
                        cur.classList.remove('btn__game-field--hidden');
                        view.displayColour(cur, gameRGBvalue); // all squares of the correct colour
                    });

                    // show reset button and hide reroll and hint buttons
                    view.endGameState();

                    //header and all setting buttons of the correct colour
                    const correctColourString = `rgb(${gameRGBvalue.red}, ${gameRGBvalue.green}, ${gameRGBvalue.blue}`
                    base.elements.header.style.background = correctColourString;
                    base.elements.btnSettings.forEach(el => {
                        el.style.backgroundColor = correctColourString;
                    });
                }

                // steps to get array of squares that are currently hidden, code taken from the hint btn event listener (can i write it as a function somewhere?)
                const existingSquaresArray = Array.from(document.querySelectorAll('.btn__game-field'));
                const squaresToRemoveArray = existingSquaresArray.filter(el => el.dataset.answer === 'false');
                const hiddenSquares = squaresToRemoveArray.filter(el => el.classList.value.includes('btn__game-field--hidden'));

                // checks if number of squares left is low enough to delete the hint button
                // numSquares is either 3/6/9 since this event listener callback happens on square clicks, which are displayed upon a difficulty level selection and reroll button, which initialises the displayNewGameSquares function to give numSquares a value
                if (hiddenSquares.length === (numSquares / 3)) { 
                    base.elements.hint.classList.add('btn__hint--hidden');
                }
            }
        });

        //difficulty selection option
        base.elements.difficulty.addEventListener('change', () => {
            if (base.elements.difficulty.value !== '') {
                displayNewGameSquares();
            }
        });

        //reroll colour button
        base.elements.reroll.addEventListener('click', () => {
            // if squares exist, reroll everything
            if (document.querySelectorAll('.btn__game-field').length !== 0) {
                displayNewGameSquares();

                //shows hint button
                base.elements.hint.classList.remove('btn__hint--hidden');
            }
        });

        // hint button 
        base.elements.hint.addEventListener('click', () => {
            // if squares exist, do sth
            if (document.querySelectorAll('.btn__game-field').length !== 0) {
                //filters out an array of squares to delete (excluding the correct one)
                const existingSquaresArray = Array.from(document.querySelectorAll('.btn__game-field'));
                const squaresToRemoveArray = existingSquaresArray.filter(el => el.dataset.answer === 'false');
                const finalSquaresToRemove = squaresToRemoveArray.filter(el => !el.classList.value.includes('btn__game-field--hidden'));
                const hiddenSquares = squaresToRemoveArray.filter(el => el.classList.value.includes('btn__game-field--hidden'));
                //ensures that number of squares removed will always be numSquares / 3
                const squaresToRemove = (numSquares / 3) - hiddenSquares.length;

                finalSquaresToRemove.sort(() => 0.5 - Math.random()); //shuffles and mutates original array
                
                for (let i = 0; i < squaresToRemove; i++) {
                    finalSquaresToRemove[i].classList.add('btn__game-field--hidden');
                }

                //hides this button
                base.elements.hint.classList.add('btn__hint--hidden');

                // set game to active
                view.setActiveGameState();
            }
        });

        // reset button
        base.elements.reset.addEventListener('click', () => {
            // bring back the hint button
            base.elements.hint.classList.remove('btn__hint--hidden');

            // remove rgb heading 
            base.elements.rgbDisplay.classList.remove('header__rgb-value--shown');

            // remove the squares (since no sqs till diffculty selection)
            base.elements.gameField.innerHTML = '';

            // set difficulty selection to placeholder
            base.elements.difficulty.selectedIndex = 0;

            // remove diffculty selection's disabled attribute
            base.elements.difficulty.removeAttribute('disabled');

            // hide ownself (this reset button) and show reroll button again
            base.elements.reset.style.display = 'none';
            base.elements.reroll.style.display = 'inline-block';

            // set colours of all setting buttons and header back to original colours
            base.elements.header.style.background = 'linear-gradient(to right, #ff9472, #f2709c)';
            base.elements.btnSettings.forEach(el => {
                el.style.backgroundColor = '#f2709c';
            });

            // remove winning display
            base.elements.winDisplay.classList.remove('header__win-display--shown');
        })
    }

    // display a random rgb in the heading
    const displayGameRGBvalue = function() {
        gameRGBvalue = model.calcRGBvalue();
        view.displayRGBvalue(gameRGBvalue);
    }

    //display 3/6/9 squares in the grid (to be called in setting up event listeners function which is returned in the obj)
    const displayGameSqs = function() { //display 9 randomly coloured squares, THEN replace 1 of them with the answer later
        numSquares = view.getDifficultyNumOfSq();
        const gameSquareArray = model.createSquaresData(numSquares);
        view.displaySquares(gameSquareArray);
    }

    const displayCorrectSq = function() { //need access to the gameRGBvalue and numSquares for the changeOneToCorrectSquare method, so putting those in the controller IIFE scope not sure if it will work
        view.changeOneToCorrectSquare(gameRGBvalue, numSquares);
    }

    const displayNewGameSquares = function() {
        displayGameRGBvalue();
        //clear game field
        base.elements.gameField.innerHTML = '';

        displayGameSqs();
        displayCorrectSq();
    }

    return {
        init: function() {
            base.elements.difficulty.selectedIndex = 0; //setting dropdown list back to placeholder on reloads/restarting of game
            setUpEventListeners();
        }
    }
})();


controller.init();