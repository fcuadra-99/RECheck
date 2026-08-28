// import { describe, it, expect, vi, beforeEach } from 'vitest';
// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import DeviationReportForm from '../../src/pages/researcher/Deviation';

// vi.mock('../../src/services/deviationReportService', () => ({
//   submitDeviationReport: vi.fn(),
// }));
// vi.mock('../../src/services/fileUploadService', () => ({
//   FileUploadService: { uploadFiles: vi.fn() },
//   UPLOAD_CONFIGS: { DEVIATIONS: {} },
// }));
// vi.mock('../../src/components/DigitalSignaturePad', () => ({
//   __esModule: true,
//   default: (props: any) => <div data-testid="sigpad">SignaturePad</div>,
// }));
// vi.mock('../../src/hooks/useAuth', () => ({ __esModule: true, default: () => ({ user: { id: 'u1' } }) }));

// import { submitDeviationReport } from '../../src/services/deviationReportService';
// import { FileUploadService } from '../../src/services/fileUploadService';

// describe('DeviationReportForm', () => {
//   beforeEach(() => {
//     vi.clearAllMocks();
//   });

//   const fillRequired = () => {
//     const type = screen.getByLabelText(/deviation type/i);
//     fireEvent.change(type, { target: { value: 'Other' } });
//     const title = screen.getByLabelText(/study title/i);
//     fireEvent.change(title, { target: { value: 'T' } });
//     const code = screen.getByLabelText(/protocol number/i);
//     fireEvent.change(code, { target: { value: 'P' } });
//     const eff = screen.getByLabelText(/effectivity/i);
//     fireEvent.change(eff, { target: { value: '2024-01-01' } });
//     const site = screen.getByLabelText(/study site/i);
//     fireEvent.change(site, { target: { value: 'S' } });
//     const tel = screen.getByLabelText(/^telephone/i);
//     fireEvent.change(tel, { target: { value: '1' } });
//     const mob = screen.getByLabelText(/^mobile/i);
//     fireEvent.change(mob, { target: { value: '1' } });
//     const ddate = screen.getByLabelText(/date of deviation/i);
//     fireEvent.change(ddate, { target: { value: '2024-01-01' } });
//     const sdate = screen.getByLabelText(/submission date/i);
//     fireEvent.change(sdate, { target: { value: '2024-01-01' } });
//     const desc = screen.getByLabelText(/detailed description/i);
//     fireEvent.change(desc, { target: { value: 'D' } });
//     const rat = screen.getByLabelText(/^rationale/i);
//     fireEvent.change(rat, { target: { value: 'R' } });
//     const imp = screen.getByLabelText(/^impact/i);
//     fireEvent.change(imp, { target: { value: 'I' } });
//     const corr = screen.getByLabelText(/proposed corrective actions/i);
//     fireEvent.change(corr, { target: { value: 'C' } });
//     const inv = screen.getByLabelText(/investigator corrective action/i);
//     fireEvent.change(inv, { target: { value: 'IC' } });
//     const sev = screen.getByLabelText(/severity/i);
//     fireEvent.change(sev, { target: { value: 'Minor' } });
//   };

//   it('should validate required fields', async () => {
//     render(<DeviationReportForm />);
//     fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
//     // Should render errors (aria-invalid set). We check no service calls were made.
//     expect((submitDeviationReport as any)).not.toHaveBeenCalled();
//   });

//   it('should submit, upload files, and show signature pad on success', async () => {
//     (FileUploadService.uploadFiles as any).mockResolvedValue([]);
//     (submitDeviationReport as any).mockResolvedValue({ data: [{ id: 'rep-1' }], error: null });

//     render(<DeviationReportForm />);
//     fillRequired();
//     fireEvent.click(screen.getByRole('button', { name: /submit report/i }));

//     await waitFor(() => expect(submitDeviationReport).toHaveBeenCalled());
//     expect(await screen.findByTestId('sigpad')).toBeInTheDocument();
//   });
// });


