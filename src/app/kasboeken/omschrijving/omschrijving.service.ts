import { Injectable } from '@angular/core';
import { Omschrijvingbeknopt } from './omschrijvingbeknopt';
import { environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OmschrijvingService {
  url = environment.apiUrl + '/omschrijvingen';

  async getOmschrijvingen(afdelingId: number): Promise<Omschrijvingbeknopt[]> {
    const omschrijvingenUrl = this.url + `/${afdelingId}`;
    const data = await fetch(omschrijvingenUrl);
    return await data.json() ?? [];
  }

  async verwijderOmschrijving(id: number) {
    const omschrijvingenUrl = this.url + `/${id}`;
    const response = await fetch(omschrijvingenUrl, {method: "DELETE"});
    if (!response.ok) {
      console.error('Fout bij verwijderen omschrijving');
    }
  }
}
