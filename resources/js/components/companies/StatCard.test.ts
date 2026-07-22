import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import StatCard from './StatCard.vue';

describe('StatCard', () => {
    it('renders title, value, and description', () => {
        const wrapper = mount(StatCard, {
            props: {
                title: 'Total Companies',
                value: 42,
                description: 'as of today',
            },
        });

        expect(wrapper.text()).toContain('Total Companies');
        expect(wrapper.text()).toContain('42');
        expect(wrapper.text()).toContain('as of today');
    });

    it('omits the description when none is provided', () => {
        const wrapper = mount(StatCard, {
            props: { title: 'Total Companies', value: 0 },
        });

        expect(wrapper.text()).toContain('Total Companies');
        expect(wrapper.text()).not.toContain('as of today');
    });
});
