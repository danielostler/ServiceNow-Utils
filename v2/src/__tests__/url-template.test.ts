import { describe, it, expect } from 'vitest';
import { resolveTemplate } from '../shared/utils/url-template';

const BASE_CTX = {
  input: '',
  table: 'incident',
  sysId: 'abc123',
  encodedQuery: 'active=true',
  filterValues: {},
};

describe('resolveTemplate', () => {
  it('replaces $table and $sysid', () => {
    const result = resolveTemplate('/$table.do?sys_id=$sysid', BASE_CTX);
    expect(result).toBe('/incident.do?sys_id=abc123');
  });

  it('replaces $0 with encoded user input', () => {
    const result = resolveTemplate('/search.do?q=$0', { ...BASE_CTX, input: 'hello world' });
    expect(result).toBe('/search.do?q=hello%20world');
  });

  it('replaces $1, $2 with split tokens', () => {
    const result = resolveTemplate('/acl.do?name=$1&op=$2', {
      ...BASE_CTX,
      input: 'incident read',
    });
    expect(result).toBe('/acl.do?name=incident&op=read');
  });

  it('replaces $encodedquery', () => {
    const result = resolveTemplate('/list.do?q=$encodedquery', BASE_CTX);
    expect(result).toBe('/list.do?q=active=true');
  });

  it('appends user input to {{key}} filter ending with operator', () => {
    const result = resolveTemplate('/list.do?sysparm_query={{query}}', {
      ...BASE_CTX,
      input: 'John',
      filterValues: { query: 'active=true^nameSTARTSWITH' },
    });
    expect(result).toBe('/list.do?sysparm_query=active=true^nameSTARTSWITHJohn');
  });

  it('uses plain {{key}} value when it does not end with an operator', () => {
    const result = resolveTemplate('/search?labelkey={{release}}&q=$0', {
      ...BASE_CTX,
      input: 'gliderecord',
      filterValues: { release: 'yokohama' },
    });
    expect(result).toBe('/search?labelkey=yokohama&q=gliderecord');
  });
});
