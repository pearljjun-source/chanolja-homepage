'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateNews(id?: string) {
  revalidatePath('/news')
  if (id) {
    revalidatePath(`/news/${id}`)
  }
}
