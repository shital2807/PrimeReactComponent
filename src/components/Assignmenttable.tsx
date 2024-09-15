import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

const GrocTable: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [first, setFirst] = useState<number>(0);
  const [rows, setRows] = useState<number>(12);
  const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const op = useRef<OverlayPanel>(null);
  const toast = useRef<Toast>(null);

  const fetchArtworks = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}&limit=${rows}&fields=id,title,place_of_origin,artist_display,inscriptions,date_start,date_end`);
      if (!response.ok) {
        throw new Error('Failed to fetch artworks');
      }
      const data = await response.json();
      setArtworks(data.data);
      setTotalRecords(data.pagination.total);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching artworks:', error);
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.current?.show({ severity: 'error', summary: 'Error', detail: `Failed to fetch artworks. ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  }, [rows]);

  useEffect(() => {
    fetchArtworks(1);
  }, [fetchArtworks]);

  const onPageChange = (event: { first: number; rows: number; page: number }) => {
    setFirst(event.first);
    setRows(event.rows);
    fetchArtworks(event.page + 1);
  };

  const handleRowSelectionChange = (event: { value: Artwork[] }) => {
    setSelectedArtworks(event.value);
  };

  const selectMultipleRows = async (count: number) => {
    setLoading(true);
    let newSelectedArtworks = [...selectedArtworks];
    let remainingCount = count;
    let currentFetchPage = 1;

    while (remainingCount > 0 && currentFetchPage <= Math.ceil(totalRecords / rows)) {
      try {
        const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${currentFetchPage}&limit=${rows}&fields=id,title,place_of_origin,artist_display,inscriptions,date_start,date_end`);
        if (!response.ok) {
          throw new Error('Failed to fetch artworks for selection');
        }
        const data = await response.json();
        
        for (const artwork of data.data) {
          if (remainingCount > 0 && !newSelectedArtworks.some(a => a.id === artwork.id)) {
            newSelectedArtworks.push(artwork);
            remainingCount--;
          } else if (remainingCount === 0) {
            break;
          }
        }
        
        currentFetchPage++;
      } catch (error) {
        console.error('Error selecting multiple rows:', error);
        let errorMessage = 'An unexpected error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        toast.current?.show({ severity: 'error', summary: 'Error', detail: `Failed to select multiple rows. ${errorMessage}` });
        break;
      }
    }

    setSelectedArtworks(newSelectedArtworks);
    setLoading(false);
    op.current?.hide();
    toast.current?.show({ severity: 'success', summary: 'Success', detail: `Selected ${newSelectedArtworks.length - selectedArtworks.length} new artworks` });
  };

  const selectionHeaderTemplate = (
    <div className="flex items-center">
      <Button
        icon="pi pi-chevron-down"
        className="p-button-rounded p-button-text"
        onClick={(e) => op.current?.toggle(e)}
        aria-haspopup
        aria-controls="overlay_panel"
      />
    </div>
  );

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <div className="flex items-center mb-4">
        <span className="mr-2">Selected: {selectedArtworks.length}</span>
      </div>
      <DataTable
        value={artworks}
        loading={loading}
        selection={selectedArtworks}
        onSelectionChange={handleRowSelectionChange}
        dataKey="id"
        emptyMessage="No artworks found"
        className="mb-4"
        selectionMode="multiple"
      >
        <Column
          selectionMode="multiple"
          headerStyle={{ width: '4rem' }}
          header={selectionHeaderTemplate}
        />
        <Column field="title" header="Title" />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Start Date" />
        <Column field="date_end" header="End Date" />
      </DataTable>
      <Paginator
        first={first}
        rows={rows}
        totalRecords={totalRecords}
        onPageChange={onPageChange}
      />
      <OverlayPanel ref={op} id="overlay_panel" style={{ width: '300px' }}>
        <div className="p-inputgroup">
          <InputNumber
            placeholder="Number of rows to select"
            min={1}
            max={totalRecords - selectedArtworks.length}
            onChange={(e) => selectMultipleRows(e.value as number)}
          />
          <Button label="Submit" onClick={() => op.current?.hide()} />
        </div>
      </OverlayPanel>
    </div>
  );
};

export default GrocTable;