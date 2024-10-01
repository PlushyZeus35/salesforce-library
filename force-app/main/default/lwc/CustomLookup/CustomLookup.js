/**
 * @component CustomLookup
 * @description This component represents a custom lookup 
 *      in which the search for records is allowed. 
 *      It simulates a standard Salesforce lookup.
 * @author Borja Lorenzo
 * @date 01-10-2024
 * @version 1.0.0
 * @example
 * <CustomLookup label="Click me"></CustomLookup>
 * @usage
 *  This component allows the search by the 'Name' field in the records 
 *  passed by parameter in lookup format. When a record is selected an 
 *  event called 'lookupupdate' will be fired.
 *  The records available in the searches must be previously passed to 
 *  the component. It must be an array of objects that, at least, must 
 *  contain an Id attribute (whose value must be unique in the list) 
 *  and another Name attribute (with which the search will be performed).
 * 
 * @remarks
 * - Supports the following properties:
 *      - @property {String} label: Label to be displayed above the input.
 *      - @property {String} placeholder: Label displayed inside input when no record is selected.
 *      - @property {String} iconName: Icon displayed next to the records. Must follow slds format.
 *      - @property {String} defaultRecordId: Id of the initially selected record
 *      - @property {String} emptyLabel: Message displayed when no records were found in search
 *      - @property {String} records: List of available records. It must be an array of objects in which, at least, contains an Id and a Name.
 *      - @property {Boolean} disabled: Indica si el botón está deshabilitado.
 *
 */
import { LightningElement,api} from 'lwc'; 

export default class CustomLookup extends LightningElement {
    // public properties with initial default values 
    @api label = 'custom lookup label';
    @api placeholder = 'search...'; 
    @api iconName = 'standard:account';
    @api defaultRecordId = '';
    @api emptyLabel = 'No records found';
    @api records;
    @api disabled = false;

    // private properties 
    lstResult = []; // to store list of returned records   
    hasRecords = true; 
    searchKey=''; // to store input field value    
    isSearchLoading = false; // to control loading spinner  
    delayTimeout;
    selectedRecord = {}; // to store selected lookup record in object formate 
    perimeterAccounts;
    displayPillBox = false;
    displaySearchBox = true;
    debouncedSearch = this.debounce(this.searchFunction, 1000);

   // initial function to populate default selected lookup record if defaultRecordId provided  
    connectedCallback(){
        if(this.records && this.records.length>0)
            this.lstResult = this.records.slice(0, 5);
        else
            this.hasRecords = false;

        if(this.defaultRecordId && this.records){
            const initialValue = this.records.find(data => data.Id === this.defaultRecordId);
            if(initialValue){
                this.selectedRecord = initialValue;
                this.displaySearchBox = false;
                this.displayPillBox = true;
            }
        }
    }

    @api
    resetLookupRecords(recordList){
        this.records = recordList;
        if(this.records)
            this.lstResult = this.records.slice(0, 5);
        else
            this.hasRecords = false;

        this.selectedRecord = {};
        this.lookupUpdatehandler(undefined); // update value on parent component as well from helper function 
        // remove selected pill and display input field again 
        const searchBoxWrapper = this.template.querySelector('.searchBoxWrapper');
        searchBoxWrapper.classList.remove('slds-hide');
        searchBoxWrapper.classList.add('slds-show');

        const pillDiv = this.template.querySelector('.pillDiv');
        pillDiv.classList.remove('slds-show');
        pillDiv.classList.add('slds-hide');
    }

    @api
    setRecord(record){
        this.records.add(record);
        this.selectedRecord = record;
        this.lookupUpdatehandler(this.selectedRecord); // update value on parent component as well from helper function 
        this.handelSelectRecordHelper(); // helper function to show/hide lookup result container on UI
    }
    
    
       
    // update searchKey property on input field change 
    handleKeyChange(event) {
        // Debouncing this method: Do not update the reactive property as long as this function is
        // being called within a delay of DELAY. This is to avoid a very large number of Apex method calls.
        this.isSearchLoading = true;
        this.hasRecords = true;
        const searchKey = event.target.value;
        this.debouncedSearch(searchKey)        
    }

    searchFunction(key){
        this.isSearchLoading = true;
        if(key){
            this.lstResult = this.records
                .filter(eachAccount => eachAccount.Name.toLowerCase().includes(key.toLowerCase()))
                .slice(0, 5);
            if(this.lstResult.length==0)
                this.hasRecords = false;
        }else{
            this.lstResult = this.records.slice(0, 5);
        }
        this.isSearchLoading = false;
    }

    // method to toggle lookup result section on UI 
    toggleResult(event){
        const lookupInputContainer = this.template.querySelector('.lookupInputContainer');
        const clsList = lookupInputContainer.classList;
        const whichEvent = event.target.getAttribute('data-source');
        switch(whichEvent) {
            case 'searchInputField':
                clsList.add('slds-is-open');
                break;
            case 'lookupContainer':
                clsList.remove('slds-is-open');    
                break;                    
        }
    }

    debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    // method to clear selected lookup record  
    handleRemove(event){
        event.preventDefault();
        //this.searchKey = '';    
        this.selectedRecord = {};
        this.lookupUpdatehandler(undefined); // update value on parent component as well from helper function 
        this.lstResult = this.records.slice(0, 5);
        // remove selected pill and display input field again 
        this.displaySearchBox = true;
        this.displayPillBox = false;
    }

    // method to update selected record from search result 
    handelSelectedRecord(event){  
        var objId = event.target.getAttribute('data-recid'); // get selected record Id 
        this.selectedRecord = this.lstResult.find(data => data.Id === objId); // find selected record from list 
        this.lookupUpdatehandler(this.selectedRecord); // update value on parent component as well from helper function 
        this.handelSelectRecordHelper(); // helper function to show/hide lookup result container on UI
    }

    /*COMMON HELPER METHOD STARTED*/
    handelSelectRecordHelper(){
        const lookupInputContainer = this.template.querySelector('.lookupInputContainer')
        if(lookupInputContainer)
            lookupInputContainer.classList.remove('slds-is-open');
        this.displaySearchBox = false;
        this.displayPillBox = true; 
    }

    // send selected lookup record to parent component using custom event
    lookupUpdatehandler(value){   
        const oEvent = new CustomEvent('lookupupdate',
            {
                'detail': {selectedRecord: value}
            }
        );
        this.dispatchEvent(oEvent);
    }
}