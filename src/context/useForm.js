import { useContext } from 'react'
import { FormContext } from './FormContextObject'

export const useForm = () => useContext(FormContext)
