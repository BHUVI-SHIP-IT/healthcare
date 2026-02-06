export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            User: {
                Row: {
                    id: string
                    email: string
                    name: string
                    role: string
                    classSection: string | null
                    createdAt: string
                    updatedAt: string
                }
                Insert: {
                    id: string
                    email: string
                    name: string
                    role: string
                    classSection?: string | null
                    createdAt?: string
                    updatedAt?: string
                }
                Update: {
                    id?: string
                    email?: string
                    name?: string
                    role?: string
                    classSection?: string | null
                    createdAt?: string
                    updatedAt?: string
                }
            }
            HealthRequest: {
                Row: {
                    id: string
                    userId: string
                    symptoms: string
                    description: string | null
                    status: string
                    classSection: string
                    exitToken: string | null
                    createdAt: string
                    updatedAt: string
                }
                Insert: {
                    id?: string
                    userId: string
                    symptoms: string
                    description?: string | null
                    status?: string
                    classSection: string
                    exitToken?: string | null
                    createdAt?: string
                    updatedAt?: string
                }
                Update: {
                    id?: string
                    userId?: string
                    symptoms?: string
                    description?: string | null
                    status?: string
                    classSection?: string
                    exitToken?: string | null
                    createdAt?: string
                    updatedAt?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
