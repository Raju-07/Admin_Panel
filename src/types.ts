// src/types.ts
export type Driver = {
  id: string
  full_name: string
  phone: string
  email: string
  auth_user_id?: string
}

export type Load = {
  id: string
  load_number: string // always a string in DB
  commodity: string | null
  pallets: number | null
  weights: number | null
  pickup_location: string
  delivery_location: string
  pickup_datetime: string
  delivery_datetime: string
  status: string
  drivers?: Driver | null
  driver_id?:string | null
}
