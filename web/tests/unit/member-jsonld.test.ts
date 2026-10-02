import { describe, expect, it } from 'vitest';
import { team } from '@/lib/data';
import { memberPersonNode } from '@/lib/seo';

describe('memberPersonNode (team profiles)', () => {
  it('links the person to the lab Organization through an OrganizationRole', () => {
    const sarah = team.people.find((p) => p.slug === 'sarah-mendoza')!;
    const node = memberPersonNode({ ...sarah, sameAs: [sarah.links!.scholar!] });
    expect(node).toMatchObject({
      '@type': 'Person',
      '@id': 'https://arcslab.io/team/sarah-mendoza#person',
      name: 'Sarah Mendoza',
      url: 'https://arcslab.io/team/sarah-mendoza',
      image: 'https://arcslab.io/images/people/sarah-mendoza.jpg',
      memberOf: {
        '@type': 'OrganizationRole',
        startDate: '2025',
        memberOf: { '@id': 'https://arcslab.io/#organization' },
      },
    });
    expect(node.memberOf).not.toHaveProperty('endDate');
  });

  it('alumni get an endDate; empty optional fields are omitted', () => {
    const alum = team.people.find((p) => p.group === 'alumni')!;
    const node = memberPersonNode(alum);
    expect(node.memberOf.endDate).toBe(String(alum.endYear));
    expect(node).not.toHaveProperty('image');
    expect(node).not.toHaveProperty('sameAs');
  });
});
