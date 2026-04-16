'use server'
import { redirect } from 'next/navigation'

export default async function FormPage() {
  redirect('/login')
}