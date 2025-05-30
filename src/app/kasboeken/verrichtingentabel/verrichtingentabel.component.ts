import {
  AfterViewInit,
  booleanAttribute,
  Component,
  inject,
  Input,
  input,
  numberAttribute,
  OnChanges,
  OnInit,
  SimpleChanges, ViewChild
} from '@angular/core';
import {MatRow, MatTableDataSource, MatTableModule} from '@angular/material/table';
import {Verrichting} from '../verrichting';
import {KasboekService} from '../kasboek.service';
import {KruisjeAlsTicketPipe} from './kruisje-als-ticket.pipe';
import {BedragInOfUitPipe} from './bedrag-in-of-uit.pipe';
import {NieuweverrichtingComponent} from "../nieuweverrichting/nieuweverrichting.component";
import {NgIf} from '@angular/common';
import {MatButton} from '@angular/material/button';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatCheckbox} from '@angular/material/checkbox';
import {OmschrijvingComponent} from '../omschrijving/omschrijving.component';
import {MatSort, MatSortHeader, Sort, SortHeaderArrowPosition} from '@angular/material/sort';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import {LeegAlsBlancoTypePipe} from './leeg-als-blanco-type.pipe';
import {Cashmunten} from '../cashmunten/cashmunten.component';

/**
 * @title Basic use of `<table mat-table>`
 */
@Component({
  selector: 'verrichtingen-table',
  styleUrl: 'verrichtingentabel.component.css',
  templateUrl: 'verrichtingentabel.component.html',
  standalone: true,
  imports: [MatTableModule, KruisjeAlsTicketPipe, BedragInOfUitPipe, NieuweverrichtingComponent, NgIf, MatButton, MatFormField, MatInput, MatLabel, ReactiveFormsModule, MatCheckbox, OmschrijvingComponent, MatSortHeader, MatSort, LeegAlsBlancoTypePipe, Cashmunten],
})

export class VerrichtingenTabel implements OnChanges, AfterViewInit {
  @Input({transform: numberAttribute}) kasboekId: number;
  @Input({transform: numberAttribute}) afdelingId: number;
  displayedColumns: string[] = ['volgnummer', 'dag', 'omschrijving', 'bedragin', 'bedraguit', 'ticket', 'type', 'wijzig', 'cancel', 'delete'];
  verrichtingen: Verrichting[] = [];
  dataSource = new MatTableDataSource(this.verrichtingen);
  berekendSaldo: number;
  verschilSaldos: number;
  kasboekService: KasboekService = inject(KasboekService);
  saldoFormulier = new FormGroup({
    werkelijkSaldoInput: new FormControl(''),
  });
  private _liveAnnouncer = inject(LiveAnnouncer);
  @ViewChild(MatSort) sort: MatSort;

  laadVerrichtingen() {
    if (!isNaN(this.kasboekId)) {
      this.kasboekService.getVerrichtingen(this.kasboekId)
        .then(data => {
          this.verrichtingen = data;
          this.dataSource.data = this.verrichtingen;
          this.berekendSaldo = parseFloat((this.berekenTotaal('IN') - this.berekenTotaal('UIT')).toFixed(2));
        })
        .catch((error) => {
          console.error('Verrichtingen konden niet worden opgehaald: ' + error);
          this.dataSource.data = [];
        });
    }
  }

  ngOnChanges() {
    console.log("kasboek wordt geladen");
    this.laadVerrichtingen();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  updateTabel() {
    this.laadVerrichtingen();
  }

  /** Announce the change in sort state for assistive technology. */
  announceSortChange(sortState: Sort) {
    // This example uses English messages. If your application supports
    // multiple language, you would internationalize these strings.
    // Furthermore, you can customize the message to add additional
    // details about the values being sorted.
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  opslaan(oudeVolgnummer: number) {
  }

  verwijderen(oudeVolgnummer: number) {
    console.log('verrichting ' + oudeVolgnummer + ' wordt verwijderd');
    this.kasboekService.verwijderVerrichting(this.kasboekId, oudeVolgnummer)
      .then(() => this.laadVerrichtingen())
      .catch((error) => console.error('Fout: ' + error));
  }

  autocompleteHandler(inhoud: string) {
  }

  berekenTotaal(item: string) {
    let totaal = 0.0;
    if (item === 'IN') {
      totaal = this.dataSource.data.map(rij => rij.bedrag)
        .filter(element => element > 0)
        .reduce((acc, el) => (acc + el), 0);
      totaal = parseFloat(totaal.toFixed(2));
    } else if (item === 'UIT') {
      totaal = this.dataSource.data.map(rij => rij.bedrag)
        .filter(element => element < 0)
        .reduce((acc, el) => (acc + el), 0);
      totaal = Math.abs(parseFloat(totaal.toFixed(2)));
    } else if (item === 'tickets') {
      totaal = this.dataSource.data.map(rij => rij.kasticket)
        .filter(el => el).length;
    }
    return totaal;
  }

  saldoUpdateHandler() {
    const werkelijSaldoInput = this.saldoFormulier.controls.werkelijkSaldoInput.value;
    if (werkelijSaldoInput !== null) {
      this.verschilSaldos = parseFloat((parseFloat(werkelijSaldoInput) - this.berekendSaldo).toFixed(2));
    }

  }
}
