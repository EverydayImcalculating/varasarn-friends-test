import { describe, expect, it } from 'vitest'
import { TimetableService } from '../src/services/timetable-client'
describe('TimetableService', () => it('uses only self-scoped timetable RPCs', async () => { const calls: string[]=[]; const service=new TimetableService({rpc:async(name)=>{calls.push(name);return {data:[],error:null}}}); await service.list(); await service.clear(); expect(calls).toEqual(['list_my_timetable','clear_my_timetable']) }))
