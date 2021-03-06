import React, { Component } from 'react';
import classNames from 'classnames';

// styles
import styles from './SelectInput.scss';

interface SelectInputProps {
  options: string[];
  title: string;
  className?: string;
  onChangeOption: (event) => void;
}

class SelectInput extends Component<SelectInputProps, {}> {
  render() {
    const { options, title } = this.props;
    return (
      <div className={classNames(this.props.className, styles.commonSelectInput)}>
        <div className={styles.title}>{title}</div>
        <select onChange={this.props.onChangeOption}>
          {options.map((item, index) => {
            return (
              <option key={index} value={index}>
                {item}
              </option>
            );
          })}
        </select>
      </div>
    );
  }
}

export default SelectInput;
