export type OrderStatus = 'placed' | 'approved' | 'delivered';

export interface Order {
  id: number;
  petId: number;
  quantity: number;
  shipDate: string;
  status: OrderStatus;
  complete: boolean;
}