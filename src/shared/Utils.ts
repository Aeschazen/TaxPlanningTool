import { useState, useRef } from 'react'
import type {
    Dispatch,
    RefObject,
} from 'react'
import Decimal from 'decimal.js'
import { DateTime } from 'luxon'

export interface Trigger{
    isTriggered: boolean
    trigger: () => void
}

export function useTrigger(): Trigger{
    const tracker1 = useRef(Symbol())
    const [tracker2, setTracker2] = useState(tracker1.current)
    const isTriggered = useRef(false)
    if (tracker1.current !== tracker2){
        tracker1.current = tracker2
        isTriggered.current = true
    }else{
        isTriggered.current = false
    }
    
    return {
        isTriggered: isTriggered.current,
        trigger(){
            setTracker2(Symbol())
        },
    }
}

export interface TriggerableRef<T>{
    isTriggered: boolean
    ref: RefObject<T>
    trigger: () => void
}

export function useTriggerableRef<T>(initialState: T): TriggerableRef<T>{
    const { isTriggered, trigger } = useTrigger()
    const ref = useRef<T>(initialState)
    
    return {
        isTriggered: isTriggered,
        ref,
        trigger,
    }
}

export interface TrackedState<T>{
    isModified: boolean
    value: T
    set: Dispatch<T>
}

export function useTrackedState<T>(initialState: T): TrackedState<T>{
    const { isTriggered, trigger } = useTrigger()
    const state = useRef<T>(initialState)
    
    return {
        isModified: isTriggered,
        value: state.current,
        set(value){
            trigger()
            state.current = value
        },
    }
}

export interface ChangeTracked<T>{
    isModified: boolean
    value: T
    setValue: (value: T) => void
    setUnmodified: () => void
}

export function createChangeTracked<T>(initialState: T): ChangeTracked<T>{
    const _this: ChangeTracked<T> = {
        isModified: false,
        value: initialState,
        setValue(value){
            _this.isModified = true
            _this.value = value
        },
        setUnmodified(){
            _this.isModified = false
        }
    }
    
    return _this
}

export function* generateSequenceWithGap(start1: number, length1: number, start2: number, length2: number){
    let value = start1
    for (let i = 0; i < length1; i++){
        yield value++
    }
    value = start2
    for (let i = 0; i < length2; i++){
        yield value++
    }
}

export function clampLimit(limitAmount: Decimal, amount: Decimal){
    if (amount.gt(limitAmount))
    {
        return {
            netAmount: limitAmount,
            netAmountOverLimit: amount.minus(limitAmount),
        }
    }
    else
    {
        return {
            netAmount: amount,
            netAmountOverLimit: new Decimal(0),
        }
    }
}

export function convertBEToAD(year: number){
  return year - 543
}

export function convertADToBE(year: number){
  return +DateTime.fromObject({ year }).toFormat('yyyy', { outputCalendar: 'buddhist' })
}
