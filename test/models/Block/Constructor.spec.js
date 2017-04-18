import { expect, assert } from 'chai';
import Block from '../../../src/models/Block';
import _ from 'lodash';

const withJenkins = !!process.env.JENKINS;

describe('Model', () => {
  describe('Block', () => {
    describe('Constructor', () => {
      let block;
      beforeEach(() => {
        block = new Block();
      });

      it('accepts initial model', () => {
        const existing = {
          metadata: {
            name: 'blah',
          },
        };
        const inst = new Block(existing);

        expect(inst.metadata.name).to.equal('blah');
      });

      it('new Block(input, false) creates an unfrozen block with instance methods', () => {
        const date = Date.now() - 1000000;

        const unfrozen = new Block({
          metadata: {
            created: date,
          },
        }, false);

        expect(unfrozen.metadata.created).to.equal(date);

        expect(() => Object.assign(unfrozen, { id: 'newId' })).to.not.throw();
        expect(unfrozen.id).to.equal('newId');

        expect(() => _.merge(unfrozen, { metadata: { some: 'value' } })).to.not.throw();

        expect(typeof unfrozen.merge).to.equal('function');
        expect(typeof unfrozen.getName).to.equal('function');
      });

      it('Block.classless(input) creates unfrozen JSON object, no instance methods', () => {
        const instance = Block.classless({
          rules: { role: 'promoter' },
        });

        expect(instance.rules.role === 'promoter');

        expect(instance.id).to.be.defined;

        expect(() => Object.assign(instance, { id: 'newId' })).to.not.throw();
        expect(instance.id).to.equal('newId');

        expect(() => _.merge(instance, { metadata: { some: 'value' } })).to.not.throw();

        expect(instance.merge).to.be.undefined;
        expect(instance.clone).to.be.undefined;
        expect(instance.getName).to.be.undefined;
      });

      //only for sync
      function timed(fn, allow = 1000) {
        const start = process.hrtime();
        fn();
        const end = process.hrtime();
        const diff = ((end[0] - start[0]) + ((end[1] - start[1]) / Math.pow(10, 9))) * 1000;

        console.log('took ' + diff + ' of ' + allow);

        if (diff > allow) {
          throw Error('test took too long');
        }
      }

      //note times are conservative so that they pass in traivs (lame boxes)

      it('should make new Block() quickly', function makeBlocksFast() {
        const perSecond = 1500;
        const number = 1000;
        const timeout = number * 1000 / perSecond;

        timed(() => {
          _.range(number).map(() => new Block());
        }, timeout);
      });

      it('should make Block.classless() quickly', function makeBlocksFast() {
        const perSecond = 1500;
        const number = 1000;
        const timeout = number * 1000 / perSecond;

        timed(() => {
          _.range(number).map(() => Block.classless());
        }, timeout);
      });
    });
  });
});
