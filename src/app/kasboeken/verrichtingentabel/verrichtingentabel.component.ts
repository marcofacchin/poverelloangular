import {
  AfterViewInit,
  booleanAttribute,
  Component, EventEmitter,
  inject,
  Input,
  input,
  numberAttribute,
  OnChanges,
  OnInit, Output,
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
import {MatOption} from '@angular/material/core';
import {MatSelect} from '@angular/material/select';
import {VerrichtingsType} from '../nieuweverrichting/verrichtings-type';

/**
 * @title Basic use of `<table mat-table>`
 */
@Component({
  selector: 'verrichtingen-table',
  styleUrl: 'verrichtingentabel.component.css',
  templateUrl: 'verrichtingentabel.component.html',
  standalone: true,
  imports: [MatTableModule, KruisjeAlsTicketPipe, BedragInOfUitPipe, NieuweverrichtingComponent, NgIf, MatButton, MatFormField, MatInput, MatLabel, ReactiveFormsModule, MatCheckbox, OmschrijvingComponent, MatSortHeader, MatSort, LeegAlsBlancoTypePipe, Cashmunten, MatOption, MatSelect],
})

export class VerrichtingenTabel implements OnChanges, AfterViewInit {
  @Input({transform: numberAttribute}) kasboekId: number;
  @Input({transform: numberAttribute}) afdelingId: number;
  @Input({transform: numberAttribute}) refresh: number;
  @Output() updateNieuweVerrichtingEvent = new EventEmitter<boolean>();
  displayedColumns: string[] = ['volgnummer', 'dag', 'omschrijving', 'bedragin', 'bedraguit', 'ticket', 'type', 'wijzig', 'cancel', 'delete'];
  verrichtingen: Verrichting[] = [];
  dataSource = new MatTableDataSource(this.verrichtingen);
  wijzigveVrichtingFormulier = new FormGroup({
    volgnummer: new FormControl(''),
    dag: new FormControl(''),
    omschrijving: new FormControl(''),
    bedrag: new FormControl(''),
    ticket: new FormControl(false),
    type: new FormControl(''),
  });
  omschrijving: string;
  verrichtingstypesArray = Object.values(VerrichtingsType).slice(0,13);
  saldoFormulier = new FormGroup({
    werkelijkSaldoInput: new FormControl(''),
  });
  berekendSaldo: number;
  verschilSaldos: number;
  kasboekService: KasboekService = inject(KasboekService);
  private _liveAnnouncer = inject(LiveAnnouncer);
  @ViewChild(MatSort) sort: MatSort;

  laadVerrichtingen() {
    if (!isNaN(this.kasboekId)) {
      console.log("verrichtingen worden geladen");
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

  wijzig(volgnummer: number) {
    const verrichting = this.dataSource.data.find(el => el.volgnummer === volgnummer);
    if (verrichting !== undefined) {
      this.wijzigveVrichtingFormulier.controls.volgnummer.setValue(verrichting.volgnummer.toString());
      this.wijzigveVrichtingFormulier.controls.dag.setValue(verrichting.dag.toString());
      this.wijzigveVrichtingFormulier.controls.omschrijving.setValue(verrichting.omschrijving);
      this.wijzigveVrichtingFormulier.controls.bedrag.setValue(verrichting.bedrag.toString());
      this.wijzigveVrichtingFormulier.controls.ticket.setValue(verrichting.kasticket);
      this.wijzigveVrichtingFormulier.controls.type.setValue(verrichting.verrichtingsType);
    } else {
      console.error("verrichting bestaat niet");
    }

  }

  opslaan(oudeVolgnummer: number) {
    const volgnummerInput = this.wijzigveVrichtingFormulier.controls.volgnummer.value;
    const dagInput = this.wijzigveVrichtingFormulier.controls.dag.value;
    const bedragInput = this.wijzigveVrichtingFormulier.controls.bedrag.value;
    const typeInput = this.wijzigveVrichtingFormulier.controls.type.value;
    let ticketInput = false;
    if (this.wijzigveVrichtingFormulier.controls.ticket.value !== null) {
      ticketInput = this.wijzigveVrichtingFormulier.controls.ticket.value;
    }
    if (bedragInput !== null
      && volgnummerInput !== null
      && dagInput !== null
      && typeInput !== null
    ) {
      const nieuweverrichting = {
        volgnummer: parseInt(volgnummerInput),
        dag: parseInt(dagInput),
        bedrag: parseFloat(bedragInput),
        afdelingId: this.afdelingId,
        omschrijving: this.omschrijving,
        kasticket: ticketInput,
        verrichtingsType: typeInput
      };
      this.kasboekService.wijzigVerrichting(this.kasboekId, oudeVolgnummer, nieuweverrichting)
        .then(() => {
          this.updateTabel();
          this.updateNieuweVerrichtingEvent.emit(true);
        })
        .catch((error) => console.error(error));
    } else {
      console.error("niet alle inputs zijn oke");
      console.log(
        "afdelingId:" + this.afdelingId
        + "\nvolgnummer:" + volgnummerInput
        + "\nbedrag:" + bedragInput
        + "\ndag:" + dagInput
        + "\nomschrijving:" + this.omschrijving
        + "\nkasticket:" + ticketInput
        + "\ntype:" + typeInput
      );
    }
  }

  verwijderen(oudeVolgnummer: number) {
    this.kasboekService.verwijderVerrichting(this.kasboekId, oudeVolgnummer)
      .then(() => this.laadVerrichtingen())
      .catch((error) => console.error('Fout: ' + error));
  }

  autocompleteHandler(inhoud: string) {
    this.omschrijving = inhoud;
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
