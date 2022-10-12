"use strict";

//JQUERY EVENT HANDLERS
$(document).ready(function() {
	$("#entryForm").on("submit", recordGiving);
	$("#clearBtn").on("click", clearEntries);
	$("#summaryBtn, #hideBtn").on("click", function(e) {
		$("#detailsDiv").slideToggle();
		$("#summaryDiv").slideToggle();
		if (this.id == 'summaryBtn') { //ONLY UPDATE THE SUMMARY WHEN SUMMARY BUTTON IS CLICKED
			manageSummary.show();
		}
	});
});

//DECLARE GLOBAL VARIABLES IN THIS SECTION
const records = new Array(); //INITIALIZE AN ARRAY TO HOLD THE GIVING RECORDS

//DEFINE PRIMARY FUNCTIONS IN THIS SECTION
function recordGiving() { //GET THE ENTRY VALUES FROM THE FORM & RECORD THEM
	const type = document.forms.entryForm.type.value;
	const numEntries = document.forms.entryForm.querySelectorAll('div.row').length - 1; //SUBTRACT 1 FOR THE FIRST ROW OF ELEMENTS [REMOVE THE SELECT & SUBMIT]
	for (let i = 0; i < numEntries; i++) {
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
		//localStorage.removeItem("giving");
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
	
	return tr;
}

const manageTotal = (function() { //IMMEDIATELY INVOKED MODULE THAT EXPOSES 'incrementTotal' & 'updateTotal'
	let totalVal = 0; //INITIALIZE THE VARIABLE AT ZERO
	
	return {
		incrementTotal: function(amount) { //ADDS 'AMOUNT' TO THE TOTAL & THEN RETURNS THE NEW VALUE
			totalVal += amount;
			return totalVal;
		},
		updateTotal: function(elementId) { //UPDATES THE REFERENCED ELEMENT WITH A FORMATED $ TOTAL
			const total = document.getElementById(elementId);
			total.textContent = `Total:  $ ${totalVal.toLocaleString()}`;
		}
	};
})();

const manageEntries = (function() { //IMMEDIATELY INVOKED MODULE THAT EXPOSES 'addRecord'
	function addDetails(type, id, amount) { //THIS ADDS RECORDS TO THE DETAILS SHEET
		const table = document.getElementById(type + 'Table'); //GET REFERENCE TO THE APPLICABLE TABLE; 'TYPE' SHOULD MATCH THE FIRST PART OF THE ELEMENT ID
		table.appendChild(buildTableRow([id, amount.toFixed(2).toLocaleString()]));
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
			return [this.id, this.amount.toFixed(2).toLocaleString()];
		}
	}
	
	return {
		addRecord: function(type, id, amount) {
			if (!id) { //CHECK FOR NO NAME/ID & ADD DEFAULT STRING IF MISSING
				id = '<n/a>';
			} else {
				records.push(new Entry(type, id, amount)); //SAVE TO THE RECORDS ARRAY FOR THE SUMMARY REPORT
			}
			manageTotal.incrementTotal(amount);
			manageTotal.updateTotal('total'); //HAVE THE TOTAL UPDATED IN THE DOCUMENT
			addDetails(type, id, amount); //ADD THE RECORD TO THE APPROPRIATE DETAILS SHEET
		}
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
			const idA = a.id.toUpperCase();
			const idB = b.id.toUpperCase();
			if (idA < idB) {
				return -1;
			}
			if (idA > idB) {
				return 1;
			}
			
			return 0;
		});
		
		records.forEach(record => {
			if (record.id != '<n/a>') { //WE ONLY NEED TO SEE MATCHED ID'S
				table.appendChild(buildTableRow(record.details));
			}
		});
	}
	
	return {
		show: getSummary
	}
})();

const manageForm = (function(){ //IMMEDIATELY INVOKED MODULE THAT EXPOSES 'resetInputs'
	const form = document.forms.entryForm; //GET A REFERENCE TO THE FORM
	const select = document.getElementById('type'); //REFERENCE THE SELECT ELELMENT IN THE DOM
	const types = { //THIS OBJECT HOLDS THE TYPES
		check: 'loose checks',
		pink: 'pink envelopes',
		yellow: 'yellow envelopes'
	}
	
	function resetInputs() {
		form.querySelectorAll('input.form-control').forEach(input => {
			input.value = '';
		});
		form.querySelector('input.form-control').focus(); //SET FOCUS ON THE FIRST TEXT INPUT FIELD IN THE FORM
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
		for (let i = 0; i < 6; i++) { //THIS IS THE NUMBER OF INPUT ELEMENT PAIRS
			form.appendChild(buildEntryRow(i));
		}
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
		inputId.name = i + 'number';
		inputId.placeholder = 'Name or Number';
		col1.appendChild(inputId);
		
		row.appendChild(col1);
		
		const col2 = document.createElement('div');
		col2.classList.add("col");
		
		const inputAmount = document.createElement('input');
		inputAmount.type = 'number';
		inputAmount.classList.add("form-control");
		inputAmount.name = i + 'amount';
		inputAmount.step = 'any';
		inputAmount.placeholder = 'Amount 0.00';
		col2.appendChild(inputAmount);
		
		row.appendChild(col2);
			
		return row;
	}
	
	return {
		resetInputs: resetInputs
	};
})();

//MAIN EXECUTION STARTS HERE
document.getElementById('pageTitle').innerHTML += ' v1.7'; //APPEND THE VERSION NUMBER TO THE PAGE TITLE