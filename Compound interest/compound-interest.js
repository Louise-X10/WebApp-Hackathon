function computeTargetValue (target, allFields) {
    [initialValue, interestValue, timeValue, finalValue] = allFields.map((elt) => elt.value);;
    interestValue = interestValue / 100;
    targetValue = 0;
    switch (target){
        case final:
            targetValue = Number(initialValue) * (1 + Number(interestValue)) ** Number(timeValue);
            break;
        case initial:
            targetValue =  Math.log(Number(finalValue) / Number(initialValue)) / Math.log(1 + Number(interestValue));
            break;
        case time:
            targetValue = Math.log(Number(finalValue) / Number(initialValue)) / Math.log(1 + Number(interestValue));
            break;
        case interest:
            targetValue =  Math.pow(Number(finalValue) / Number(initialValue), 1/Number(timeValue)) - 1;
            break;
    }
    return targetValue;
}

function calculate (allFields) {
    // If initial trial, then check for missing field and compute
    // If recompute trial, then find focused field and recompute

    const initialTrial = allFields.every((elt) => elt.className === "userInput");

    // Count number of non-empty fields
    nonEmptyFields = 0
    for (field of allFields){
        if (field.value) {
            nonEmptyFields++;
        }
    }
    // if initial trial but not 3 fields, throw error 
    // if initial trial with 3 fields, compute output for missing field
    // if not initial trial but has 3 fields, compute output for missing field
    // if not initial trial but has 4 fields, recompute output
    if (initialTrial && nonEmptyFields !== 3) {
        alert('Please enter 3 of the 4 fields, no more and no less!')
    } else if (initialTrial || nonEmptyFields === 3) {
        // Identify the target field, i.e. the field with no value
        target = allFields.filter(field => !field.value)[0]; 
        // Compute value for missing field and focus it
        targetValue = computeTargetValue(target, allFields);
        target.value = targetValue;
        target.className = "result";
        // Add message right next to input field
        targetID = target.getAttribute('id');
        targetMsg = document.querySelector("#" + targetID + "+label, " + "#" + targetID + "+span+label");
        targetMsg.textContent = "   Computing for this output!";

        
    } else { 
        console.log("case 3");
        // Find output field and reompute its value
        for (field of allFields){
            if (field.className === "result"){
                target = field;
                break;
            }
        }
         // Display calculated amount
        targetValue = computeTargetValue(target, allFields);
        target.value = targetValue;
    }

}

function action () {
    /* Depracate function
    // Reset input fields to unfocused
    for (target of allFields){
        target.className = "userInput";
    }
    */
    calculate(allFields);
}

function clear () {
    // Reset input fields to empty and unfocused
    for (target of allFields){
        target.className = "userInput";
        target.value= '';
    }
}

function reset () {
    // Reset input fields to unfocused, remove compute message
    for (target of allFields){
        target.className = "userInput";
        targetID = target.getAttribute('id');
        targetMsg = document.querySelector("#" + targetID + "+label, " + "#" + targetID + "+span+label");
        targetMsg.textContent = " ";
    }
}

const initial = document.querySelector('#initial');
const time = document.querySelector('#time'); 
const interest = document.querySelector('#interest');
const final = document.querySelector('#final');
const allFields = [initial, interest, time, final];

const computeBtn = document.querySelector("#compute");
const clearBtn = document.querySelector("#clear");
const resetBtn = document.querySelector("#reset");

computeBtn.addEventListener('click', action);
clearBtn.addEventListener('click', clear);
resetBtn.addEventListener('click', reset);