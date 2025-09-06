export interface Notification {
  id: string;
  title: string;
  description: string;
  type: string; // e.g. 'decision', 'clearance', etc.
  created_at: string;
}
