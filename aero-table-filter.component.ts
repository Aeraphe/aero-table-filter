import {Component, Input, EventEmitter, Output, OnChanges, SimpleChange, OnInit} from 'angular2/core';
import {IAeroTableDataColumn, IAeroTableDataRow, IAeroRow} from '../aero-table/aero-table.interface.component';
@Component({
    selector: 'aero-table-filter',
    template: `
    <div class="row" style="padding-top:25px;padding-bottom:25px;">
  <div class="col-lg-3">
    <div class="input-group">
      <input  style="height:35px;" type="text" (click)="showFilter=false" [(ngModel)]="filterInput" (ngModelChange)="applyFilter(filterApplyed)"  placeholder="Buscar na tabela"  class="form-control">
      <div class="input-group-btn" [class.open]="showFilter">
        <button (click)="showHideFilterOptions()" type="button" class="btn btn-white ">Filtros <span class="caret"></span></button>
        <ul  (mouseleave)="showHideFilterOptions()"  class="dropdown-menu ">
                  <li (click)="applyFilter('clearAll')"><a >Limpar Filtros</a><i class="fa fa-trash " ></i></li>
                  <li (click)="setFilter('standard')"><a >Filtro padrão</a><i class="fa  text-success" [class.fa-check]="filterApplyed=='standard'"></i></li>
                  <li (click)="setFilter('filterAndScroll')"><a >Filtro busca</a><i class="fa  text-success" [class.fa-check]="filterApplyed=='filterAndScroll'"></i></li>
<hr>
          <li  *ngFor="let column of filterOptions"><a (click)="setfilteredColumn(column.id)">{{column.name}}</a> <i class="fa  text-danger" [class.fa-check]="column.filter==true"></i></li>

        </ul>
      </div><!-- /btn-group -->
    </div><!-- /input-group -->
  </div><!-- /.col-lg-6 -->
</div><!-- /.row -->
<style>
.dropdown-menu > li{position:relative;}
.dropdown-menu > li > i{position:absolute;right:15px;top:11px;}
</style>
    `
})

export /**
 * AeroTableFilterComponent
 */
    class AeroTableFilterComponent implements  OnInit {
    //Data that will be filter
    @Input() dataForFilter: Array<IAeroTableDataRow>;
    //Number of records per page calculete by the filter
    @Input() pageRecords: number;
    //Set the start setup of records per page
    public userRecordsPerPage:number=null;


    @Input() columnsForFilter: Array<IAeroTableDataColumn>;
    /**
     * The filtred result
     * 
     */
    @Output() public filterEvent = new EventEmitter<Object>();
    @Output() public filterName = new EventEmitter<any>();
    


    public totalColumns: number;
    public showFilter: boolean = false;
    //The value for find or filter for
    public filterInput: string;

    public filterOptions: any;
    //Define the type of filter to be applyed in the data
    @Input() public filterApplyed:string='standard';
    //Change the filter type
    setFilter(filterType:string){
        this.filterApplyed=filterType;
    }

    constructor(parameters) {

    }

    /**
     * Load data for the filter component
     */
    ngOnInit() {
        this.setFilterColumnsOnInit(this.columnsForFilter);
        this.totalColumns = this.columnsForFilter.length;
        //Set the start setup of records per page
        if(this.userRecordsPerPage==null){
            this.userRecordsPerPage=this.pageRecords;
        }
        

    }
    
        /**
     * Methos for show or hide the dropdown filter options
     */
    showHideFilterOptions() {
        this.showFilter = !this.showFilter;
    }
    
    /**
     * Set first column to the standard filter option 
     * on the init of the component
     * and disable other filters
     */
    setFilterColumnsOnInit(columns: Array<IAeroTableDataColumn>) {
        this.filterOptions = columns.map((item: any) => {
            let newObject: any;
            newObject = item;
            newObject['filter'] = false;
            if (item.id === 1) {
                item['filter'] = true;
            }
            return newObject;

        })



    }
    
    /**
     * This is Controller Method for apply the filter type to data
     */
    applyFilter(filter: string, data?: any): void {
        var dataFiltrated: any;
        switch (filter) {
            case "standard":
                dataFiltrated = this.filterCellsDataByColumns();
                console.log(dataFiltrated);
                this.filterEvent.emit(dataFiltrated);
                
                break;

            case 'filterAndScroll':
                  dataFiltrated = this.filterCellsDataByColumns();
                  let rows = this.filterScrollTo(dataFiltrated);
                                 
                 
                break;

            case "clearAll":
                this.clearAllFilters();
                break;


            default:
                break;
        }


    }
    

    setfilteredColumn(columnId: number): void {

        let options = this.filterOptions.map((item: any) => {
            if (item.id === columnId) {

                item['filter'] = !item.filter;

            }
            return item;
        });
        this.filterOptions = options;
    }


    /**
     * this method clear ao filters and call load data in initial state
     */
    clearAllFilters(): void {

        let options = this.filterOptions.map((item: any) => {


            item['filter'] = false;


            return item;
        });
        this.filterOptions = options;
        this.filterInput = "";
        this.pageRecords = this.userRecordsPerPage;
       let dataFiltrated= this.filterCellsDataByColumns();
       this.filterEvent.emit(dataFiltrated);
    }

    /**
* This method will get the input data dataForFilter and loop from it 
* checking if the tdValue value correspond the filterInput string
* and return a Array of Objects with the result
* 
*/
    public filterCellsDataByColumns(): any {
        var searchResult: Array<any> = [];
        var dataFiltrateddResult: Object;


        //Check the filter input string
        if (this.filterInput && this.filterInput.length > 0) {
            //Map the filtred data to new object
            this.dataForFilter.map((item: any) => {
                let newObject: Array<IAeroTableDataRow>;
                let data: any = item.cell;
                //Creat a Array for store the coluns
                var columnsId: Array<number> = [];
                //Macth the string column by column
                for (let column of this.filterOptions) {

                    if (column.filter && data[column.id - 1].value != null && data[column.id - 1].value != undefined) {
                        //Set a regex for macth the string

                        let re = new RegExp(this.filterInput, 'gi');
                        //Convert all value to string for match method
                        if (data[column.id - 1].value.toString().match(re)) {
                            //Create the new object whith the filtred data
                            searchResult.push({ row: item.row, cell: item.cell });

                        }


                    }
                }


            })
            //Remove duplicates resulting from the match over mult columns 
            let dataPrepared = this.removeDuplicates(searchResult);
            dataFiltrateddResult = { recordsPerPage: dataPrepared.recordNumber, dataFiltred: dataPrepared.data };



        } else {
            this.pageRecords = this.userRecordsPerPage;
            dataFiltrateddResult = { recordsPerPage: this.pageRecords, dataFiltred: this.dataForFilter };


        }

        return dataFiltrateddResult;



    }
    


    /**
     * This method removes the duplicates records return from the filter match
     * from mult columns'
     */
    removeDuplicates(filtredData: Array<IAeroTableDataRow>) {
        var filterDataPrepared: Array<any> = [];
        var row: Array<number> = [];
        var records: number = 0;
        filtredData.forEach((item: any) => {
            let data: any = item.row;

            //Get the firs record
            if (row.length == 0) {
                //Save the row id fro compare
                row.push(data.id);
                //Put the first record in the new array
                filterDataPrepared.push({ row: item.row, cell: item.cell });
                //Calculate the records per page for show all records ate once in Aero table
                records++;

            } else {
                //Get the next records and compare whit the next records
                var rowCount = 0;
                //Set a flag for check if the record is uniq
                var uniq: number = 0;
                while (rowCount < row.length && uniq == 0) {
                    if (row[rowCount] == data.id) {
                        uniq = 1;

                    }
                    rowCount++;

                }
                //If the flag return 0 value insert the record in the new array<Object>
                if (uniq === 0) {

                    row.push(data.id);
                    filterDataPrepared.push({ row: item.row, cell: item.cell });
                    records++;
                }

            }


        })//--foreach


        return { data: filterDataPrepared, recordNumber: records };
    }
    
    
    /**
     * This method recives the Filtrated data and scroll to row in table.
     * 
     */   
    public filterScrollTo(dataFiltrated:any) {
              
        var rowsMap=dataFiltrated.dataFiltred.map((item:any)=>{
            let rows:any;
             rows = item.row;
            return rows;
        });
        console.log(rowsMap);
        
        if (this.filterInput != null && this.filterInput.length != 0 && rowsMap[0]!=undefined) {
            var findRow = document.getElementById("row-" + rowsMap[0].id);
            if (findRow != null) {

                var rowScrowPosition = findRow.offsetTop;
                var table = document.getElementById('aero-scrow');
                var setTo = table.offsetTop;

                table.scrollTop = rowScrowPosition;
                console.log(setTo, "  ", rowScrowPosition);
            } else { console.log('Not Find'); }
        }
         return dataFiltrated;

    }
    
   
}
