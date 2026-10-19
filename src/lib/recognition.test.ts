import { describe, it, expect } from 'vitest'
import { parseRecognitionResult, recognitionToFormPatch } from './recognition'

describe('parseRecognitionResult', () => {
  it('非对象输入返回空结果', () => {
    expect(parseRecognitionResult(null)).toEqual({
      model: null,
      params: [],
      noise_db: null,
      sets_count: null,
      liter: null,
      air_volume: null,
      confidence: 'low',
      notes: null,
    })
  })

  it('将字符串数字强制转换，丢弃负数与非法值', () => {
    const r = parseRecognitionResult({ noise_db: '44', sets_count: -1, liter: 'abc', air_volume: 12.5 })
    expect(r.noise_db).toBe(44)
    expect(r.sets_count).toBeNull()
    expect(r.liter).toBeNull()
    expect(r.air_volume).toBe(12.5)
  })

  it('过滤空 params 并归一化 confidence', () => {
    const r = parseRecognitionResult({ params: ['a', '', ' b '], confidence: 'weird' })
    expect(r.params).toEqual(['a', 'b'])
    expect(r.confidence).toBe('low')
  })
})

describe('recognitionToFormPatch', () => {
  const full = parseRecognitionResult({
    model: 'WQP12',
    params: ['额定电压：220V'],
    noise_db: 44,
    sets_count: 12,
    liter: 60,
    air_volume: 18,
    confidence: 'high',
    notes: null,
  })

  it('params 未含型号时前置型号行', () => {
    expect(recognitionToFormPatch(full, 'dishwasher').productParams).toBe('型号：WQP12\n额定电压：220V')
  })

  it('params 已含型号时不重复', () => {
    const r = parseRecognitionResult({ model: 'WQP12', params: ['型号：WQP12'] })
    expect(recognitionToFormPatch(r, 'dishwasher').productParams).toBe('型号：WQP12')
  })

  it('仅填入当前类别的数值字段', () => {
    const dish = recognitionToFormPatch(full, 'dishwasher')
    expect(dish.noise).toBe('44')
    expect(dish.sets).toBe('12')
    expect(dish.liter).toBeUndefined()
    expect(dish.air).toBeUndefined()

    const wh = recognitionToFormPatch(full, 'water_heater')
    expect(wh.liter).toBe('60')
    expect(wh.noise).toBeUndefined()

    const rh = recognitionToFormPatch(full, 'range_hood')
    expect(rh.air).toBe('18')
    expect(rh.sets).toBeUndefined()
  })

  it('无识别内容时返回空补丁', () => {
    expect(recognitionToFormPatch(parseRecognitionResult(null), 'dishwasher')).toEqual({})
  })
})
