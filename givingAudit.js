"use strict";

//JQUERY EVENT HANDLERS
$(document).ready(function() {
	$("#entryForm").on("submit", recordGiving);
	$("#clearBtn").on("click", clearEntries);
	$("#type").on("change", manageForm.checkInputs); //LISTEN FOR CHANGES TO THE SELECT ELEMENT
/*	$("#summaryBtn, #hideBtn").on("click", function(e) {
		$("#detailsDiv").slideToggle();
		$("#summaryDiv").slideToggle();
		if (this.id == 'summaryBtn') { //ONLY UPDATE THE SUMMARY WHEN SUMMARY BUTTON IS CLICKED
			manageSummary.show();
		}
	});*/
	$(".form-check-input").on("change", function() { //LISTEN FOR CHANGES TO TASK CHECKBOXES
		if ($(".form-check-input:checked").length == 2) { //ONLY ENABLE THE FINAL TASKs IF THE FIRST TWO ARE COMPLETE
			$("#sendAudit, #envelopesFile").prop("disabled", false);
			manageSummary.show();
			$("#sendIt").prop("href", `mailto:jwdafoe@gmail.com?subject=${encodeURIComponent(manageForm.batchDate.value)} LVBC giving audit &body=Envelope summary: ${encodeURIComponent(finalRecords)}`);
		}
	});
});

//DECLARE GLOBAL VARIABLES IN THIS SECTION
const records = new Array(); //INITIALIZE AN ARRAY TO HOLD THE GIVING RECORDS
var finalRecords = new String(); //INITIALIZE A STRING VARIABLE TO USE IN SENDING THE RECORDS LATER

//DEFINE PRIMARY FUNCTIONS IN THIS SECTION
function recordGiving() { //GET THE ENTRY VALUES FROM THE FORM & RECORD THEM
	const type = document.forms.entryForm.type.value;
	for (let i = 0; i < manageForm.inputRows; i++) {
		const id = document.forms.entryForm[i + 'number'].value;
		const amount = document.forms.entryForm[i + 'amount'].value;
		if (amount) { //CHECK FOR & ONLY ADD ENTRIES THAT ARE NOT EMPTY
			manageEntries.addRecord(type, id, Number(amount));
		}
	}
	manageForm.resetInputs();
}

function clearEntries() {
	if (confirm("This action will clear all the Entries & reset all Totals to zero.")) {
		localStorage.removeItem("giving");
		document.location.reload();
	}
	else {console.log('User cancelled');}
}

function buildTableRow(details) {
	const tr = document.createElement('tr');
	const tdId = document.createElement('td');
	tdId.textContent = details[0];
	tr.appendChild(tdId);
	
	const tdAmount = document.createElement('td');
	tdAmount.classList.add('text-end');
	tdAmount.textContent = details[1];
	tr.appendChild(tdAmount);
	
/*	const tdType = document.createElement('td');
	tdType.textContent = details[2];
	tr.appendChild(tdType);*/
	
	return tr;
}

const manageEntries = (function() { //IMMEDIATELY INVOKED MODULE THAT EXPOSES 'addRecord'
	function addDetails(type, id, amount) { //THIS ADDS RECORDS TO THE DETAILS SHEET
		const table = document.getElementById(type + 'Table'); //GET REFERENCE TO THE APPLICABLE TABLE; 'TYPE' SHOULD MATCH THE FIRST PART OF THE ELEMENT ID
		table.appendChild(buildTableRow([id, amount.toFixed(2).toLocaleString()]));
	}
	
	function addRecord(type, id, amount) {
		if (!id) { //CHECK FOR NO NAME/ID & ADD DEFAULT STRING IF MISSING
			id = '<n/a>';
		}
		records.push(new Entry(type, id, amount)); //SAVE TO THE RECORDS ARRAY FOR THE SUMMARY REPORT
		saveRecords();
		addDetails(type, id, amount); //ADD THE RECORD TO THE APPROPRIATE DETAILS SHEET
	}
	
	function saveRecords() { //SAVE TO LOCALSTORAGE FOR PERSISTENCE
		localStorage.setItem("giving", JSON.stringify(records));
	}
	
	class Entry{
		constructor(type, id, amount) {
			this.type = type;
			while (id.length < 3) { //ID NUMBERS MUST BE 3 DIGITS, SO PAD ZEROS FOR ANYTHING LESS THAN 100
				id = '0' + id;
			}
			this.id = id;
			this.amount = amount;
		}
		get details() {
			//return `${this.id}: $ ${this.amount.toFixed(2).toLocaleString()}`;
			return [this.type, this.id, this.amount.toFixed(2).toLocaleString()];
		}
	}

	(function restoreRecords() { //PULL IN ANY RECORDS PREVIOUSLY SAVED TO LOCALSTORAGE
		if (localStorage.getItem("giving")) {
			JSON.parse(localStorage.getItem("giving")).forEach(function(entry) {
				addRecord(entry.type, entry.id, Number(entry.amount));
			});
		}
	})();
	
	return {
		addRecord: addRecord
	}
})();

const manageSummary = (function() { //IMMEDIATELY INVOKED MODULE THAT EXPOSES 'getSummary'
	(function hide() {
		document.getElementById('summaryDiv').style.display = 'none';
	})();
	function getSummary() { //SORTS ALL ENTRIES BY NAME OR GIVING NUMBER
		const table = document.getElementById('summaryTable');
		while (table.firstChild) { //CLEAR OUT ANY EXISTING RECORDS IN THE SUMMARY ELEMENT
			table.removeChild(table.firstChild);
		}
		records.sort((a, b) => {
			const idA = a.type;
			const idB = b.type;
			//const idA = a.id.toUpperCase();
			//const idB = b.id.toUpperCase();
			if (idA < idB) {
				return -1;
			}
			if (idA > idB) {
				return 1;
			}
			
			return 0;
		});
		
		records.forEach(record => {
			table.appendChild(buildTableRow(record.details));
			finalRecords += '\n' + record.details[0] + ';' + record.details[1] + ';' + record.details[2];
		});
		finalRecords += '\n\n'; //ADD TWO BLANK LINES AFTER THE SUMMARY FOR FORMATTING PURPOSES
		//mail = `mailto:jwdafoe@gmail.com?subject=${encodeURIComponent(manageForm.batchDate.value)} LVBC giving audit &body=Envelope summary: ${encodeURIComponent(finalRecords)}`
	}
	
	return {
		show: getSummary
	}
})();

const manageForm = (function(){ //IMMEDIATELY INVOKED MODULE THAT EXPOSES 'inputRows', 'batchDate', 'resetInputs' & 'checkInputs'
	const inputRows = 1; //THIS IS THE NUMBER OF INPUT ELEMENT PAIRS IN THE FORM
	const form = document.forms.entryForm; //GET A REFERENCE TO THE FORM
	const date = document.getElementById('batchDate'); //REFERENCE THE DATE INPUT ELEMENT IN THE DOM
	const select = document.getElementById('type'); //REFERENCE THE SELECT ELELMENT IN THE DOM
	const types = { //THIS OBJECT HOLDS THE TYPES
		//check: 'loose checks',
		pink: 'pink envelopes',
		yellow: 'yellow envelopes'
	}
	
	function resetInputs() {
		form.querySelectorAll('input.resetThis').forEach(input => {
			input.value = '';
		});
		form.querySelector('input.resetThis').focus(); //SET FOCUS ON THE FIRST TEXT INPUT FIELD IN THE FORM
	}
	
	function checkInputs() { //FOR YELLOW ENVELOPES, THE ID/NAME FIELDS SHOULD BE OF TYPE 'NUMBER'
		let inputType = (select.value === "yellow") ? 'number' : 'text';
		form.querySelectorAll('input.id').forEach(input => {
			input.type = inputType;
		});
	}
	
	(function loadSelect() { //THIS ADDS THE TYPE SELECTIONS TO THE SELECT ELEMENT
		for (let type of Object.entries(types)) {
			const opt = document.createElement('option');
			opt.value = type[0];
			opt.innerHTML = `${type[0].toUpperCase()} - ${type[1]}`;
			select.appendChild(opt);
		}
	})();
	(function loadInputs() { //ADDS ALL THE INPUT FIELDS TO THE FORM
		for (let i = 0; i < inputRows; i++) {
			form.appendChild(buildEntryRow(i));
		}
		//SET THE 'REQUIRED' FLAG ON THE FIRST AMOUNT INPUT FIELD ONLY
		document.getElementsByName('0amount')[0].required = true;
		//NOW ADD THE SUBMIT BUTTON TO THE FORM AFTER THE INPUTS
		const addBtn = document.createElement('input');
		addBtn.classList.add("btn");
		addBtn.classList.add("btn-primary");
		addBtn.type = 'submit';
		addBtn.value = "Add";
		form.appendChild(addBtn);
		
		resetInputs();
	})();
			
	function buildEntryRow(i) { //BUILDS ALL THE INPUTS FOR THE FORM
		const row = document.createElement('div');
		row.classList.add("row");
		row.classList.add("mb-2");
		
		const col1 = document.createElement('div');
		col1.classList.add("col");
		
		const inputId = document.createElement('input');
		inputId.type = 'text';
		inputId.classList.add("form-control");
		inputId.classList.add("id");
		inputId.classList.add("resetThis");
		inputId.name = i + 'number';
		inputId.placeholder = 'Name or Number';
		col1.appendChild(inputId);
		
		row.appendChild(col1);
		
		const col2 = document.createElement('div');
		col2.classList.add("col");
		
		const inputAmount = document.createElement('input');
		inputAmount.type = 'number';
		inputAmount.classList.add("form-control");
		inputAmount.classList.add("resetThis");
		inputAmount.name = i + 'amount';
		inputAmount.step = 'any';
		inputAmount.placeholder = 'Amount 0.00';
		//inputAmount.required = true;
		col2.appendChild(inputAmount);
		
		row.appendChild(col2);
			
		return row;
	}
	
	return {
		inputRows: inputRows,
		batchDate: date,
		resetInputs: resetInputs,
		checkInputs: checkInputs
	};
})();

//MAIN EXECUTION STARTS HERE
document.getElementById('pageTitle').innerHTML += ' v3.7'; //APPEND THE VERSION NUMBER TO THE PAGE TITLE
